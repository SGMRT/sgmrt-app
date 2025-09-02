import { Telemetry } from "@/src/apis/types/run";
import { getDistance } from "@/src/utils/mapUtils";
import { CourseLeg } from "../hooks/useCourseProgress";

export function nearestIndexOnPolyline(
    polyline: Telemetry[],
    point: Telemetry
) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < polyline.length; i++) {
        const d = getDistance(polyline[i], point);
        if (d < minDistance) {
            minDistance = d;
            nearestIndex = i;
        }
    }
    return {
        nearestIndex,
        nearestPoint: polyline[nearestIndex],
        nearestDistance: minDistance,
    };
}

// 레그 내 “종점까지 남은 거리”(m) — 간단히: 레그 포인트 중 현재에 가장 가까운 인덱스를 잡고 그 이후 합
export function remainingAlongLegM(
    polyline: Telemetry[],
    point: Telemetry
): number {
    if (polyline.length === 0) return Infinity;
    // 가장 가까운 인덱스
    let minIdx = 0;
    let minD = Infinity;
    for (let i = 0; i < polyline.length; i++) {
        const d = getDistance(polyline[i], point);
        if (d < minD) {
            minD = d;
            minIdx = i;
        }
    }
    // minIdx → end까지 누적
    let rest = getDistance(point, polyline[minIdx]); // 현재→최근접 포인트까지 보정
    for (let i = minIdx; i < polyline.length - 1; i++) {
        rest += getDistance(polyline[i], polyline[i + 1]);
    }
    return rest;
}

// 코스 누적 진행거리(m) = (현재 레그의 누적 끝거리) - (해당 레그에서 남은 거리)
export function progressAlongCourseM(
    legs: CourseLeg[],
    legIndex: number,
    point: Telemetry
) {
    const leg = legs[legIndex];
    if (!leg) return 0;
    const remaining = remainingAlongLegM(leg.points, point);
    return Math.max(0, leg.cumDistance - remaining);
}

// 현재 포인트와 가장 가까운 포인트 사이의 거리 (m)
export const nearestDistanceToPolylineM = (
    poly: Telemetry[],
    p: Telemetry
): number => {
    if (poly.length === 0) return Infinity;
    if (poly.length === 1) return getDistance(poly[0], p);

    const R = 6371000; // m
    const toRad = (d: number) => (Math.PI / 180) * d;
    const lat0 = toRad(p.lat);
    const k = (Math.PI / 180) * R;
    const toXY = (a: { lat: number; lng: number }) => {
        const x = (a.lng - p.lng) * Math.cos(lat0) * k;
        const y = (a.lat - p.lat) * k;
        return { x, y };
    };

    let best = Infinity;
    let prev = toXY(poly[0]);
    for (let i = 1; i < poly.length; i++) {
        const cur = toXY(poly[i]);

        const vx = cur.x - prev.x;
        const vy = cur.y - prev.y;
        const wx = 0 - prev.x;
        const wy = 0 - prev.y;
        const vv = vx * vx + vy * vy;
        let t = vv === 0 ? 0 : (wx * vx + wy * vy) / vv;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;

        const projX = prev.x + t * vx;
        const projY = prev.y + t * vy;
        const dist = Math.hypot(projX, projY);
        if (dist < best) best = dist;

        prev = cur;
    }
    return best;
};
