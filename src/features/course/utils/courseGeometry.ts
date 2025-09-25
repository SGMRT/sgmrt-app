import { Telemetry } from "@/src/apis/types/run";
import { getDistance } from "@/src/utils/mapUtils";
import { CourseLeg } from "../types/courseLeg";

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
    const { nearestIndex: minIdx } = nearestIndexOnPolyline(polyline, point);
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
): number => nearestPointOnPolylineMeters(poly, p).distanceM;
export interface NearestPointResult {
    distanceM: number; // p와 폴리라인 사이 최소 거리(m)
    segmentIndex: number; // 가까운 점이 속한 세그먼트 시작 인덱스 (i-1)
    t: number; // 세그먼트 내 보간값 [0..1]
    closestPoint: { lat: number; lng: number }; // 폴리라인 위 스냅된 지점(lat,lng)
}

export function nearestPointOnPolylineMeters(
    poly: Telemetry[],
    p: Telemetry
): NearestPointResult {
    if (poly.length === 0) {
        return { distanceM: Infinity, segmentIndex: -1, t: 0, closestPoint: p };
    }
    if (poly.length === 1) {
        return {
            distanceM: getDistance(poly[0], p),
            segmentIndex: 0,
            t: 0,
            closestPoint: poly[0],
        };
    }

    const R = 6371000; // m
    const DEG = Math.PI / 180;
    const lat0 = p.lat * DEG;
    const k = DEG * R;
    const toXY = (a: Telemetry) => ({
        x: (a.lng - p.lng) * Math.cos(lat0) * k,
        y: (a.lat - p.lat) * k,
    });
    const toLL = (x: number, y: number): { lat: number; lng: number } => ({
        lat: p.lat + y / k,
        lng: p.lng + x / (k * Math.cos(lat0)),
    });

    let best = Infinity;
    let bestSeg = 0;
    let bestT = 0;
    let bestX = 0;
    let bestY = 0;

    let prev = toXY(poly[0]);
    for (let i = 1; i < poly.length; i++) {
        const cur = toXY(poly[i]);

        const vx = cur.x - prev.x;
        const vy = cur.y - prev.y;
        const vv = vx * vx + vy * vy;

        // 원점(=p)을 선분(prev->cur)에 투영
        let t = vv === 0 ? 0 : (-prev.x * vx + -prev.y * vy) / vv;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;

        const px = prev.x + t * vx;
        const py = prev.y + t * vy;
        const d = Math.hypot(px, py);

        if (d < best) {
            best = d;
            bestSeg = i - 1;
            bestT = t;
            bestX = px;
            bestY = py;
        }

        prev = cur;
    }

    return {
        distanceM: best,
        segmentIndex: bestSeg,
        t: bestT,
        closestPoint: toLL(bestX, bestY),
    };
}

export function remainingAlongLegM_projected(
    polyline: Telemetry[],
    point: Telemetry
): number {
    if (polyline.length === 0) return Infinity;
    if (polyline.length === 1) return getDistance(point, polyline[0]);

    const { segmentIndex, t, closestPoint } = nearestPointOnPolylineMeters(
        polyline,
        point
    );

    // 1) 투영점 → 해당 세그먼트의 끝점까지
    let rest = getDistance(
        { lat: closestPoint.lat, lng: closestPoint.lng },
        polyline[segmentIndex + 1]
    );

    // 2) 그 다음 세그먼트들 전부
    for (let i = segmentIndex + 1; i < polyline.length - 1; i++) {
        rest += getDistance(polyline[i], polyline[i + 1]);
    }

    return rest;
}

export function progressAlongCourseM_projected(
    legs: CourseLeg[],
    legIndex: number,
    point: Telemetry
) {
    const leg = legs[legIndex];
    if (!leg) return 0;

    const remaining = remainingAlongLegM_projected(leg.points, point);
    return Math.max(0, leg.cumDistance - remaining);
}
