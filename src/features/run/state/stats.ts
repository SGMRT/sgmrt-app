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

const PACE_WINDOW_MS = 10_000;
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

function estimateSteps(dt: number, cadence: number) {
    const estimatedSteps = (cadence / 60) * Math.max(0, dt);
    return Math.round(estimatedSteps);
}

export function updateStats(
    prev: RunningStats,
    sample: RawRunData,
    options?: { zeroDt?: boolean }
): RunningStats {
    const { weight } = useAuthStore.getState().userInfo ?? { weight: 70 };
    const last = prev.last;
    let zero = !!options?.zeroDt;

    // zeroDt면 창 리셋(앵커 준비), 아니면 기존 창 유지
    const next: RunningStats = {
        ...prev,
        _window: zero ? [] : prev._window ?? [],
        _totalSteps: prev._totalSteps ?? 0,
    };

    if (sample.steps != null && last?.steps != null) {
        let diff = sample.timestamp - last?.timestamp;
        if (
            sample.steps > last?.steps &&
            prev._totalEstimatedSteps > 0 &&
            diff > 5000
        ) {
            zero = true;
            next._window = [];
            next._totalEstimatedSteps = 0;
        }
    }

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

    let dtSteps = 0;
    let estimated = false;

    if (!zero && last && sample.steps != null && last.steps != null) {
        const raw = sample.steps - last.steps;

        if (raw < 0) {
            // 리셋 상황: 부채도 같이 리셋
            next._totalEstimatedSteps = 0;
            dtSteps = 0;
        } else if (raw === 0) {
            // 추정 케이스
            if (prev.currentCadenceSpm != null && dtSec > 0) {
                const est = estimateSteps(dtSec, prev.currentCadenceSpm);
                if (est > 0) {
                    dtSteps = est;
                    estimated = true;
                    next._totalEstimatedSteps += est; // 추정치를 "부채"로 쌓음
                }
            }
        } else {
            // raw > 0: 실제 수치 들어왔을 때
            if (next._totalEstimatedSteps > 0) {
                const settle = Math.min(next._totalEstimatedSteps, raw);
                next._totalEstimatedSteps -= settle; // 추정분과 상계
                dtSteps = raw - settle; // 남은 실제만 반영
            } else {
                dtSteps = raw;
            }
        }

        if (dtSteps > 0) {
            next._totalSteps += dtSteps;
        }
    }

    next._window.push({
        ts: sample.timestamp,
        dist: filteredDistM,
        deltaSteps: zero ? 0 : dtSteps,
        estimated,
    });

    const cutoff = sample.timestamp - PACE_WINDOW_MS;

    while (next._window.length && next._window[0].ts < cutoff) {
        next._window.shift();
    }

    // --- 창 집계 ---
    const winTimeSec =
        next._window.length > 5
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
