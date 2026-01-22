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
 * 주어진 좌표가 라인 상에서 어느 progress(0~1)에 해당하는지 계산합니다.
 * 누적 거리 기반으로 계산합니다.
 */
export function getProgressFromPosition(
    x: number,
    y: number,
    samples: Sample[]
): number {
    const n = samples.length;
    if (n < 2) return 0;

    // 누적 거리 배열 계산
    const cumDist: number[] = [0];
    for (let i = 1; i < n; i++) {
        const dx = samples[i].x - samples[i - 1].x;
        const dy = samples[i].y - samples[i - 1].y;
        cumDist.push(cumDist[i - 1] + Math.hypot(dx, dy));
    }
    const totalDist = cumDist[n - 1];
    if (totalDist === 0) return 0;

    // 가장 가까운 세그먼트 찾기
    let minDist = Infinity;
    let bestProgress = 0;

    for (let i = 0; i < n - 1; i++) {
        const ax = samples[i].x;
        const ay = samples[i].y;
        const bx = samples[i + 1].x;
        const by = samples[i + 1].y;

        // 점 (x, y)에서 세그먼트 (a, b)까지의 최단 거리와 투영점
        const abx = bx - ax;
        const aby = by - ay;
        const apx = x - ax;
        const apy = y - ay;

        const abLenSq = abx * abx + aby * aby;
        let t = 0;
        if (abLenSq > 0) {
            t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
        }

        const projX = ax + t * abx;
        const projY = ay + t * aby;
        const dist = Math.hypot(x - projX, y - projY);

        if (dist < minDist) {
            minDist = dist;
            // 세그먼트 내 위치를 누적 거리로 변환
            const segDist = Math.hypot(abx, aby);
            const distAlongLine = cumDist[i] + t * segDist;
            bestProgress = distAlongLine / totalDist;
        }
    }

    return Math.max(0, Math.min(1, bestProgress));
}

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

    // 끝점에 도달하면 정확히 마지막 샘플 반환
    if (ts >= tN) {
        const last = samples[n - 1];
        const prev = samples[n - 2];
        return {
            x: last.x,
            y: last.y,
            d: last.d ?? 0,
            p: last.p ?? 0,
            e: last.e ?? 0,
            c: last.c ?? 0,
            t: tN,
            heading: headingBetween(prev, last),
        };
    }

    // 시작점에 도달하면 정확히 첫 샘플 반환
    if (ts <= t0) {
        const first = samples[0];
        const second = samples[1];
        return {
            x: first.x,
            y: first.y,
            d: first.d ?? 0,
            p: first.p ?? 0,
            e: first.e ?? 0,
            c: first.c ?? 0,
            t: t0,
            heading: headingBetween(first, second),
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
