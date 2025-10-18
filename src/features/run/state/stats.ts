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
    }[];
    _totalSteps: number;
    _stepInvalid: boolean;
    _stepStaleCount: number;
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
};

const PACE_WINDOW_MS = 10_000;
const MAX_SPEED_MPS = 15;
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

export function updateStats(
    prev: RunningStats,
    sample: RawRunData,
    options?: { zeroDt?: boolean }
): RunningStats {
    const { weight } = useAuthStore.getState().userInfo ?? { weight: 70 };
    const last = prev.last;
    let zero = !!options?.zeroDt;

    const next: RunningStats = {
        ...prev,
        _window: zero || prev._stepInvalid ? [] : cloneWindow(prev._window),
        _totalSteps: prev._totalSteps ?? 0,
        _stepInvalid: zero ? true : prev._stepInvalid,
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

    if (deltaSteps > 0) {
        if (next._stepInvalid) {
            next._stepInvalid = false;
        } else {
            next._totalSteps += deltaSteps;
        }
    }

    // --- 창 슬라이드 (cutoff는 push 이전) ---
    const cutoff = sample.timestamp - PACE_WINDOW_MS;
    while (next._window.length && next._window[0].ts < cutoff) {
        next._window.shift();
    }

    // --- 매 샘플 푸시  ---
    next._window.push({
        ts: sample.timestamp,
        dist: filteredDistM,
        deltaSteps: deltaSteps,
    });

    // --- 창 집계 ---
    const winTimeSec =
        next._window.length >= 2
            ? (next._window[next._window.length - 1].ts - next._window[0].ts) /
              1000
            : 0;

    const sumDist = next._window.reduce((a, b) => a + b.dist, 0);
    const rawPace = secPerKmFrom(sumDist, winTimeSec);

    let rawCadence = sample.steps ? (sample.steps.last5sSteps / 5) * 60 : null;

    if (rawCadence != null && rawCadence > 300) {
        rawCadence = null;
    }

    // console.log("rawCadence", rawCadence);
    // console.log("sample.steps.last5sSteps", sample.steps?.last5sSteps);

    // sticky
    next.currentPaceSecPerKm = rawPace ?? prev.currentPaceSecPerKm ?? null;
    next.currentCadenceSpm = rawCadence ?? prev.currentCadenceSpm ?? null;
    next.bpm = sample.bpm ?? prev.bpm ?? null;

    // 평균
    next.avgPaceSecPerKm = secPerKmFrom(
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
