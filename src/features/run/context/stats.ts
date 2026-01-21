import { getCalories } from "@/src/utils/runUtils";
import { MAX_SPEED_MPS } from "../constants";
import { RawRunData } from "../types";
import { PaceCalculator } from "../utils/paceCalculator";

export interface RunningStats {
    totalTimeMs: number;
    totalDistanceM: number;
    avgPaceSecPerKm: number | null;
    avgCadenceSpm: number | null;
    currentPaceSecPerKm: number | null;
    currentCadenceSpm: number | null;
    calories: number | null;
    gainM: number;
    lossM: number;
    bpm: number | null;
    last?: RawRunData;
    _window: {
        ts: number;
        dist: number;
        deltaSteps: number;
    }[];
    _totalSteps: number;
    _stepInvalid: boolean;
    _stepStaleCount: number;
    _paceCalculator?: PaceCalculator;
}

export const DEFAULT_STATS: RunningStats = {
    totalTimeMs: 0,
    totalDistanceM: 0,
    avgPaceSecPerKm: null,
    avgCadenceSpm: null,
    currentPaceSecPerKm: null,
    currentCadenceSpm: null,
    calories: null,
    gainM: 0,
    lossM: 0,
    bpm: null,
    _window: [],
    _totalSteps: 0,
    _stepInvalid: false,
    _stepStaleCount: 0,
    _paceCalculator: undefined,
};

// 상수는 constants.ts에서 가져오되, 일부는 로컬 유지
const MIN_VALID_DIST_M = 0.3;
const ALT_THRESHOLD_M = 0;
const MIN_ACCEPT_DT_SEC = 0.8;

function clampGlitch(distM: number, dtSec: number): number {
    if (dtSec <= 0) return 0;
    const v = distM / dtSec;
    if (v > MAX_SPEED_MPS) return 0;
    if (distM < MIN_VALID_DIST_M) return 0;
    return distM;
}

function secPerKmFrom(distM: number, dtSec: number): number | null {
    if (distM <= 0 || dtSec <= 0) return null;
    const v = distM / dtSec;
    if (v <= 0) return null;
    const pace = 1000 / v;
    return pace;
}

function estimateSteps(dt: number, cadence: number) {
    const estimatedSteps = (cadence / 60) * Math.max(0, dt);
    return Math.round(estimatedSteps);
}

function cloneWindow(win: RunningStats["_window"]) {
    return win.map((w) => ({ ...w }));
}

export interface UpdateStatsOptions {
    zeroDt?: boolean;
    /** 사용자 체중 (kg), 기본값 70 */
    weight?: number;
}

export function updateStats(
    prev: RunningStats,
    sample: RawRunData,
    options?: UpdateStatsOptions
): RunningStats {
    const weight = options?.weight ?? 70;
    const last = prev.last;
    const zero = !!options?.zeroDt;

    // PaceCalculator 인스턴스 재사용 또는 생성
    const paceCalculator = prev._paceCalculator ?? new PaceCalculator();

    // zero 모드일 때 페이스 계산기 리셋
    if (zero) {
        paceCalculator.reset();
    }

    const next: RunningStats = {
        ...prev,
        _window: zero || prev._stepInvalid ? [] : cloneWindow(prev._window),
        _totalSteps: prev._totalSteps ?? 0,
        _stepInvalid: zero ? true : prev._stepInvalid,
        _paceCalculator: paceCalculator,
    };

    // --- 시간 증분 (수용 여부 판단 이전에 dt 계산만) ---
    let dtMs = 0;
    if (!zero && last) {
        dtMs = Math.max(0, sample.timestamp - last.timestamp);
    }
    const dtSec = dtMs / 1000;

    // 짧은 dt 샘플은 완전 무시(시간/거리/창/last 모두 변경 없음)
    if (!zero && last && dtSec > 0 && dtSec < MIN_ACCEPT_DT_SEC) {
        return prev;
    }

    // 수용 결정 이후에만 시간 누적
    if (!zero && last) {
        next.totalTimeMs += dtMs;
    }

    // --- 거리 증분(글리치 필터) ---
    const rawDist = sample.distance ?? 0; // Δdistance (m)
    const filteredDistM = zero ? 0 : clampGlitch(rawDist, dtSec);
    next.totalDistanceM += filteredDistM;

    // --- 고도 누적 ---
    if (!zero && last && last.altitude != null && sample.altitude != null) {
        const dz = sample.altitude - last.altitude;
        if (Math.abs(dz) > ALT_THRESHOLD_M) {
            if (dz > 0) next.gainM += dz;
            else next.lossM += dz; // 음수 누적
        }
    }

    // --- 스텝 증분 ---
    const deltaSteps = sample.steps?.deltaSteps ?? 0;

    if (deltaSteps > 0 || (deltaSteps === 0 && next._totalSteps === 0)) {
        if (next._stepInvalid) {
            next._stepInvalid = false;
        } else {
            next._totalSteps += deltaSteps;
        }
    }

    // --- 윈도우에 샘플 추가 (레거시 호환성 유지) ---
    next._window.push({
        ts: sample.timestamp,
        dist: filteredDistM,
        deltaSteps: deltaSteps,
    });

    // --- 개선된 페이스 계산 (PaceCalculator 사용) ---
    const currentPace = zero
        ? null
        : paceCalculator.addSample(sample.timestamp, filteredDistM, dtSec);

    let rawCadence = sample.steps ? (sample.steps.last5sSteps / 5) * 60 : null;

    if (rawCadence != null && rawCadence > 300) {
        rawCadence = null;
    }

    // 현재 페이스 (개선된 PaceCalculator 사용)
    next.currentPaceSecPerKm = currentPace ?? prev.currentPaceSecPerKm ?? null;
    next.currentCadenceSpm = rawCadence ?? prev.currentCadenceSpm ?? null;
    next.bpm = sample.bpm ?? prev.bpm ?? null;

    // 평균 페이스 (PaceCalculator의 평균 계산 사용)
    next.avgPaceSecPerKm = paceCalculator.calculateAveragePace(
        next.totalDistanceM,
        next.totalTimeMs / 1000
    );

    const totalTimeSec = next.totalTimeMs / 1000;
    next.avgCadenceSpm =
        totalTimeSec > 0 && (next._totalSteps ?? 0) > 0
            ? ((next._totalSteps ?? 0) / totalTimeSec) * 60
            : prev.avgCadenceSpm ?? null;

    next.calories = getCalories({
        distance: next.totalDistanceM,
        timeInSec: totalTimeSec,
        weight: weight ?? 70,
    });

    next.last = sample;
    return next;
}
