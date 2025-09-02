import { Telemetry } from "@/src/apis/types/run";
import { getDistance } from "@/src/utils/mapUtils";

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
