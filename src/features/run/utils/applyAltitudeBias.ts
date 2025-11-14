import { Telemetry } from "@/src/apis/types/run";
import { RawData } from "@/src/types/run";

/**
 * rawData에서 altitudeAccuracy(작을수록 정확)가 가장 낮은 GPS 고도 샘플을 기준으로
 * 해당 시각과 가장 가까운 telemetry.alt와의 차이를 bias로 구해
 * 모든 telemetry.alt에 동일하게 더해주는오프셋 보정
 */
export function applyAltitudeBiasFromBestGPS(
    telemetries: Telemetry[],
    rawData: RawData[]
): Telemetry[] {
    if (!telemetries?.length || !rawData?.length) return telemetries;

    // 1) 가장 정확한 GPS 고도 샘플 선택 (altitudeAccuracy가 가장 작은 것)
    const candidates = rawData.filter(
        (r) =>
            Number.isFinite(r.altitude) &&
            Number.isFinite(r.timestamp) &&
            Number.isFinite(r.altitudeAccuracy) &&
            (r.altitudeAccuracy as number) >= 0
    );
    if (!candidates.length) return telemetries;

    const best = candidates.reduce((a, b) =>
        (a.altitudeAccuracy as number) < (b.altitudeAccuracy as number) ? a : b
    );

    // 2) best.timestamp와 가장 가까운 telemetry 찾기
    const nearestIdx = findNearestTelemetryIndex(telemetries, best.timestamp);
    if (nearestIdx < 0) return telemetries;

    // 3) bias = bestGPS.altitude - telemetryAtNearest.alt
    const nearestAlt = telemetries[nearestIdx].alt;
    if (!Number.isFinite(nearestAlt)) return telemetries;

    const bias = (best.altitude as number) - nearestAlt;

    // 4) 모든 telemetry.alt에 동일 오프셋 적용
    return telemetries.map((t) => ({
        ...t,
        alt: Number.isFinite(t.alt) ? t.alt + bias : t.alt,
    }));
}

function findNearestTelemetryIndex(telems: Telemetry[], ts: number): number {
    // 선형 탐색(데이터 길면 이진탐색으로 개선 가능)
    let idx = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < telems.length; i++) {
        const d = Math.abs((telems[i].timeStamp ?? 0) - ts);
        if (d < bestDiff) {
            bestDiff = d;
            idx = i;
        }
    }
    return idx;
}
