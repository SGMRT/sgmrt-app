import { Sample } from "../types";
import { headingBetween, lerp } from "../utils";

export type InterpolatedPose = {
    x: number;
    y: number;
    d: number;
    p: number;
    e: number;
    c: number;
    t: number;
    heading: number;
};

/**
 * 주어진 타임스탬프에서 보간된 포즈를 계산합니다.
 * 이진 탐색으로 O(log n) 복잡도를 가집니다.
 */
export function getPoseAtTimestamp(
    ts: number,
    samples: Sample[],
    T: number[],
    t0: number,
    tN: number
): InterpolatedPose {
    const n = samples.length;

    if (n === 0) {
        return { x: 0, y: 0, d: 0, p: 0, e: 0, c: 0, t: 0, heading: 0 };
    }

    if (n === 1) {
        const a = samples[0];
        return {
            x: a.x,
            y: a.y,
            d: a.d ?? 0,
            p: a.p ?? 0,
            e: a.e ?? 0,
            c: a.c ?? 0,
            t: 0,
            heading: 0,
        };
    }

    // 이진 탐색
    let lo = 0;
    let hi = n - 1;
    while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (T[mid] <= ts) lo = mid;
        else hi = mid;
    }

    const i = Math.max(0, Math.min(n - 2, lo));
    const a = samples[i];
    const b = samples[i + 1];

    const span = Math.max(1, T[i + 1] - T[i]);
    const f = Math.max(0, Math.min(1, (ts - T[i]) / span));

    return {
        x: lerp(a.x, b.x, f),
        y: lerp(a.y, b.y, f),
        d: lerp(a.d, b.d, f),
        p: lerp(a.p, b.p, f),
        e: lerp(a.e, b.e, f),
        c: lerp(a.c, b.c, f),
        t: lerp(0, tN, (ts - t0) / (tN - t0)),
        heading: headingBetween(a, b),
    };
}
