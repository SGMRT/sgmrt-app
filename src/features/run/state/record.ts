import { UserDashBoardData } from "@/src/types/run";
import type { RunningStats } from "./stats";

type RoundOpts = Partial<{
    distance: number;
    calories: number;
    pace: number;
    cadence: number;
    bpm: number;
    elevation: number;
}>;

export function buildUserRecordData(
    stats: RunningStats,
    opts?: { round?: boolean; decimals?: RoundOpts }
): UserDashBoardData {
    const d = (x: unknown, fb = 0) =>
        typeof x === "number" && Number.isFinite(x) ? x : fb;

    // 합리적 폴백: 최근 pace 없으면 평균 pace 사용, 평균 케이던스 없으면 현재 케이던스
    const totalDistance = Math.max(0, d(stats.totalDistanceM));
    const totalCalories = Math.max(0, d(stats.calories));
    const averagePace = Math.max(0, d(stats.avgPaceSecPerKm));
    const averageCadence = Math.max(
        0,
        d(stats.avgCadenceSpm, d(stats.currentCadenceSpm))
    );
    const recentPointsPace = Math.max(
        0,
        d(stats.currentPaceSecPerKm, d(stats.avgPaceSecPerKm))
    );
    const bpm = Math.max(0, d(stats.bpm));
    const totalElevationGain = Math.max(0, d(stats.gainM));
    const totalElevationLoss = Math.max(0, d(stats.lossM)); // lossM은 이미 양수 누적이라면 그대로

    let out: UserDashBoardData = {
        totalDistance,
        totalCalories,
        averagePace,
        averageCadence,
        recentPointsPace,
        bpm,
        totalElevationGain,
        totalElevationLoss,
    };

    if (opts?.round) {
        const r = (v: number, n = 0) => Number(v.toFixed(n));
        const dec = opts.decimals ?? {};
        out = {
            totalDistance: r(out.totalDistance, dec.distance ?? 0),
            totalCalories: r(out.totalCalories, dec.calories ?? 0),
            averagePace: r(out.averagePace, dec.pace ?? 0),
            averageCadence: r(out.averageCadence, dec.cadence ?? 0),
            recentPointsPace: r(out.recentPointsPace, dec.pace ?? 0),
            bpm: r(out.bpm, dec.bpm ?? 0),
            totalElevationGain: r(out.totalElevationGain, dec.elevation ?? 0),
            totalElevationLoss: r(out.totalElevationLoss, dec.elevation ?? 0),
        };
    }

    return out;
}
