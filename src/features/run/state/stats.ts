import { useAuthStore } from "@/src/store/authState";
import { getCalories } from "@/src/utils/runUtils";
import { RawRunData } from "../types";

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
        estimated: boolean;
    }[];
    _totalSteps: number;
    _totalEstimatedSteps: number;
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
    _totalEstimatedSteps: 0,
};

const PACE_WINDOW_MS = 30_000;
const MAX_SPEED_MPS = 15;
const MIN_VALID_DIST_M = 0.3;
const ALT_THRESHOLD_M = 0;
const MAX_VALID_PACE_SEC_PER_KM = 1200;

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
    if (pace > MAX_VALID_PACE_SEC_PER_KM) return null; // 너무 느리면 무효
    return pace;
}

export function updateStats(
    prev: RunningStats,
    sample: RawRunData,
    options?: { zeroDt?: boolean }
): RunningStats {
    const { weight } = useAuthStore.getState().userInfo ?? { weight: 70 };
    const zero = !!options?.zeroDt;

    // zeroDt면 창 리셋(앵커 준비), 아니면 기존 창 유지
    const next: RunningStats = {
        ...prev,
        _totalSteps: prev._totalSteps ?? 0,
    };

    const last = prev.last;

    // --- 시간 증분 ---
    let dtMs = 0;
    if (!zero && last) {
        dtMs = Math.max(0, sample.timestamp - last.timestamp);
        next.totalTimeMs += dtMs;
    }
    const dtSec = dtMs / 1000;

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

    const lastStpes = last?.steps ?? null;
    const currentSteps = sample.steps ?? null;

    let deltaSteps = 0;
    if (currentSteps != null && lastStpes != null) {
        deltaSteps = Math.max(0, currentSteps - lastStpes);
    }

    const estimateSteps = (dt: number) => {
        const cadence = prev.avgCadenceSpm ?? 160;
        const estimatedSteps = (cadence / 60) * Math.max(0, dt);
        return Math.round(estimatedSteps);
    };

    let windowDeltaSteps = 0;
    let addToTotalSteps = 0;

    if (deltaSteps > 0) {
        // 실제로 값이 들어온 경우
        // 부채 상계 진행
        let repay = Math.min(prev._totalEstimatedSteps ?? 0, deltaSteps);
        for (let i = next._window.length - 1; i >= 0 && repay > 0; i--) {
            const e = next._window[i];
            if (!e.estimated || e.deltaSteps <= 0) continue;
            const take = Math.min(e.deltaSteps, repay);
            e.deltaSteps -= take;
            repay -= take;
        }

        // 총합 상계
        const totalRepay = Math.min(prev._totalEstimatedSteps ?? 0, deltaSteps);
        addToTotalSteps = deltaSteps - totalRepay;
        next._totalEstimatedSteps =
            (prev._totalEstimatedSteps ?? 0) - totalRepay;

        windowDeltaSteps = deltaSteps;
    } else {
        if (filteredDistM > 0.5) {
            // 실제 값이 들어오지 않은 경우
            const estimatedSteps = estimateSteps(dtSec);
            windowDeltaSteps = estimatedSteps;
            addToTotalSteps = estimatedSteps;
            next._totalEstimatedSteps =
                (prev._totalEstimatedSteps ?? 0) + estimatedSteps;
        }
    }

    next._totalSteps += addToTotalSteps;

    next._window.push({
        ts: sample.timestamp,
        dist: filteredDistM,
        deltaSteps: zero ? 0 : windowDeltaSteps,
        estimated: deltaSteps === 0,
    });

    const cutoff = sample.timestamp - PACE_WINDOW_MS;
    while (
        next._window.length &&
        next._window.length > 2 &&
        next._window[0].ts < cutoff
    ) {
        next._window.shift();
    }

    // --- 창 집계 ---
    const winTimeSec =
        next._window.length > 1
            ? (next._window[next._window.length - 1].ts - next._window[0].ts) /
              1000
            : 0;

    const sumDist = next._window.reduce((a, b) => a + b.dist, 0);
    const sumSteps = next._window.reduce((a, b) => a + b.deltaSteps, 0);

    // "raw" 계산값
    const rawPace = secPerKmFrom(sumDist, winTimeSec);
    const rawCadence =
        winTimeSec > 0 && sumSteps > 0 ? (sumSteps / winTimeSec) * 60 : null;

    // sticky: 유효값이 아니면 이전 값을 유지
    next.currentPaceSecPerKm = rawPace ?? prev.currentPaceSecPerKm ?? null;
    next.currentCadenceSpm = rawCadence ?? prev.currentCadenceSpm ?? null;
    next.bpm = sample.bpm ?? prev.bpm ?? null;

    // 평균 페이스(전체)
    next.avgPaceSecPerKm = secPerKmFrom(
        next.totalDistanceM,
        next.totalTimeMs / 1000
    );

    // 평균 케이던스(전체)
    const totalTimeSec = next.totalTimeMs / 1000;
    next.avgCadenceSpm =
        totalTimeSec > 0 && (next._totalSteps ?? 0) > 0
            ? ((next._totalSteps ?? 0) / totalTimeSec) * 60
            : prev.avgCadenceSpm ?? null;

    next.calories = getCalories({
        distance: next.totalDistanceM,
        timeInSec: next.totalTimeMs / 1000,
        weight: weight ?? 70,
    });

    // 마지막 샘플 저장ß
    next.last = sample;
    return next;
}
