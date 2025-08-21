import { useAuthStore } from "@/src/store/authState";
import { getCalories } from "@/src/utils/runUtils";
import { RawRunData } from "../types";

export interface RunningStats {
    totalTimeMs: number;
    totalDistanceM: number;
    avgPaceSecPerKm: number | null;
    currentPaceSecPerKm: number | null;
    cadenceSpm: number | null;
    calories: number | null;
    gainM: number;
    lossM: number;
    bpm: number | null;
    last?: RawRunData;
    _window: { ts: number; dist: number; steps: number }[];
}

export const DEFAULT_STATS: RunningStats = {
    totalTimeMs: 0,
    totalDistanceM: 0,
    avgPaceSecPerKm: null,
    currentPaceSecPerKm: null,
    cadenceSpm: null,
    calories: null,
    gainM: 0,
    lossM: 0,
    bpm: null,
    _window: [],
};

const PACE_WINDOW_MS = 10_000;
const MAX_SPEED_MPS = 15;
const MIN_VALID_DIST_M = 0.3;
const ALT_THRESHOLD_M = 0;

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
    return 1000 / v;
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
        _window: zero ? [] : [...prev._window],
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
            else next.lossM += Math.abs(dz); // 음수 추가 금지
        }
    }

    // --- 롤링 창 갱신(앵커/실샘플) ---
    if (zero) {
        // 재개 첫 샘플: 기여 0인 앵커만 넣음
        next._window.push({ ts: sample.timestamp, dist: 0, steps: 0 });
    } else {
        next._window.push({
            ts: sample.timestamp,
            dist: filteredDistM,
            steps: sample.steps ?? 0, // Δsteps 가정
        });
    }

    // 10초 윈도 유지
    const cutoff = sample.timestamp - PACE_WINDOW_MS;
    while (next._window.length && next._window[0].ts < cutoff) {
        next._window.shift();
    }

    // --- 창 집계 ---
    const winTimeSec =
        next._window.length > 1
            ? (next._window[next._window.length - 1].ts - next._window[0].ts) /
              1000
            : 0;

    const sumDist = next._window.reduce((a, b) => a + b.dist, 0);
    const sumSteps = next._window.reduce((a, b) => a + b.steps, 0);

    // "raw" 계산값
    const rawPace = secPerKmFrom(sumDist, winTimeSec);
    const rawCadence =
        winTimeSec > 0 && sumSteps > 0 ? (sumSteps / winTimeSec) * 60 : null;

    // sticky: 유효값이 아니면 이전 값을 유지
    next.currentPaceSecPerKm = rawPace ?? prev.currentPaceSecPerKm ?? null;
    next.cadenceSpm = rawCadence ?? prev.cadenceSpm ?? null;
    next.bpm = 0;

    // 평균 페이스(전체)
    next.avgPaceSecPerKm = secPerKmFrom(
        next.totalDistanceM,
        next.totalTimeMs / 1000
    );

    next.calories = getCalories({
        distance: next.totalDistanceM,
        timeInSec: next.totalTimeMs / 1000,
        weight: weight ?? 70,
    });

    // 마지막 샘플 저장
    next.last = sample;
    return next;
}
