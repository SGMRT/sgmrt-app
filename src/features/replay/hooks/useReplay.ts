import { useCallback, useEffect, useRef, useState } from "react";

export type Sample = { x: number; y: number; timeStamp?: number };
export type PlayState = "idle" | "playing" | "paused" | "finished";

export type ReplayOptions = {
    posTauSec?: number; // 좌표 스무딩 시간상수
    headingTauSec?: number; // 헤딩 스무딩 시간상수
    maxTurnRateDps?: number; // 최대 회전 속도
    posDeadbandUnits?: number; // 좌표 데드밴드
    maxPosSpeedUnitsPerSec?: number; // 최대 속도
    visualFps?: number; // 업데이트 FPS
};

// 선형 보간
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 라디안 → 도
const toDeg = (r: number) => (r * 180) / Math.PI;
// 두 점 사이의 헤딩 계산
const headingBetween = (
    a: { x: number; y: number },
    b: { x: number; y: number }
) => (toDeg(Math.atan2(b.x - a.x, b.y - a.y)) + 360) % 360;

// -180..180로 정규화
const norm180 = (deg: number) => {
    let d = ((((deg + 180) % 360) + 360) % 360) - 180;
    return d === -180 ? 180 : d;
};

// 시간상수 → EMA 알파 (dt: 초)
const alphaFromTau = (tauSec: number, dtSec: number) =>
    tauSec <= 0 ? 1 : 1 - Math.exp(-dtSec / tauSec);

export function useReplay(samples: Sample[], opts: ReplayOptions = {}) {
    const {
        posTauSec = 0.12,
        headingTauSec = 0.18,
        maxTurnRateDps = 180,
        visualFps = 30,
    } = opts;

    const visualIntervalMs = 1000 / visualFps;
    const lastVisualPushRef = useRef<number>(0);

    const [state, setState] = useState<PlayState>("idle");
    const [progress, setProgress] = useState(0); // 0..1

    const hasTime =
        samples.length > 1 && typeof samples[0].timeStamp === "number";
    const t0 = hasTime ? (samples[0].timeStamp as number) : 0;
    const tN = hasTime
        ? (samples[samples.length - 1].timeStamp as number)
        : (samples.length - 1) * (1000 / 60);
    const total = Math.max(1, tN - t0);

    const rafRef = useRef<number | null>(null);
    const baseTsRef = useRef<number>(0);
    const pausedTsRef = useRef<number | null>(null);
    const startWallRef = useRef<number>(0);
    const lastWallRef = useRef<number | null>(null);

    const [pose, setPose] = useState(() => {
        if (samples.length > 0) {
            const a = samples[0];
            const b = samples[1] ?? a;
            return {
                x: a.x,
                y: a.y,
                heading: headingBetween(a, b),
            };
        }
        return { x: 0, y: 0, heading: 0 };
    });

    const logicalTsFromProgress = useCallback(
        (p: number) => Math.round(t0 + p * total),
        [t0, total]
    );

    const getPoseAt = useCallback(
        (ts: number) => {
            if (samples.length === 0) return { x: 0, y: 0, heading: 0 };

            if (!hasTime) {
                const idxFloat = ts / (1000 / 60);
                const i = Math.floor(idxFloat);
                const t = Math.min(1, Math.max(0, idxFloat - i));
                const a = samples[Math.min(i, samples.length - 1)];
                const b = samples[Math.min(i + 1, samples.length - 1)];
                return {
                    x: lerp(a.x, b.x, t),
                    y: lerp(a.y, b.y, t),
                    heading: headingBetween(a, b),
                };
            }

            if (ts <= t0) {
                const a = samples[0],
                    b = samples[1] ?? samples[0];
                return { x: a.x, y: a.y, heading: headingBetween(a, b) };
            }
            if (ts >= tN) {
                const a =
                    samples[samples.length - 2] ?? samples[samples.length - 1];
                const b = samples[samples.length - 1];
                return { x: b.x, y: b.y, heading: headingBetween(a, b) };
            }

            let i = 1;
            while (i < samples.length && (samples[i].timeStamp as number) < ts)
                i++;
            const right = samples[i],
                left = samples[i - 1];
            const seg =
                (right.timeStamp as number) - (left.timeStamp as number) || 1;
            const t = (ts - (left.timeStamp as number)) / seg;
            const x = lerp(left.x, right.x, t);
            const y = lerp(left.y, right.y, t);
            const heading = headingBetween(left, right);
            return { x, y, heading };
        },
        [samples, hasTime, t0, tN]
    );

    const play = useCallback(() => {
        if (state === "playing") return;
        const now = performance.now();
        baseTsRef.current =
            pausedTsRef.current ?? logicalTsFromProgress(progress);
        pausedTsRef.current = null;
        startWallRef.current = now;
        lastWallRef.current = now;
        setState("playing");

        // 현재 스무딩 값(직전) 유지용 로컬
        let sx = pose.x,
            sy = pose.y,
            sh = pose.heading;

        const tick = () => {
            const now = performance.now();
            const elapsed = now - startWallRef.current;
            const dtSec = Math.max(
                0,
                (now - (lastWallRef.current ?? now)) / 1000
            );
            lastWallRef.current = now;

            const ts = baseTsRef.current + elapsed;
            const p = (ts - t0) / total;

            // 원시 포즈
            const raw = getPoseAt(ts);

            // 좌표 스무딩 (EMA + 데드밴드 + 속도 캡)
            const dx = raw.x - sx;
            const dy = raw.y - sy;
            const dist = Math.hypot(dx, dy);

            // 데드밴드: 너무 작은 변화는 무시
            const dead = opts.posDeadbandUnits ?? 0;
            let tx = raw.x,
                ty = raw.y;
            if (dead > 0 && dist < dead) {
                tx = sx;
                ty = sy;
            }

            // 2) 속도 캡: 좌표 단위/초 기준 최대 이동량 제한
            const maxV = opts.maxPosSpeedUnitsPerSec ?? 0;
            if (maxV > 0 && dtSec > 0) {
                const maxStep = maxV * dtSec;
                const mx = tx - sx;
                const my = ty - sy;
                const mDist = Math.hypot(mx, my);
                if (mDist > maxStep) {
                    const k = maxStep / mDist;
                    tx = sx + mx * k;
                    ty = sy + my * k;
                }
            }

            // 3) EMA 스무딩: 시간상수 → alpha
            const posTau = opts.posTauSec ?? 0.12;
            if (posTau > 0) {
                const a = 1 - Math.exp(-dtSec / posTau);
                sx = sx + (tx - sx) * a;
                sy = sy + (ty - sy) * a;
            } else {
                sx = tx;
                sy = ty;
            }

            // 헤딩 스무딩
            let delta = norm180(raw.heading - sh);

            if (maxTurnRateDps > 0 && dtSec > 0) {
                const maxDelta = maxTurnRateDps * dtSec;
                if (delta > maxDelta) delta = maxDelta;
                else if (delta < -maxDelta) delta = -maxDelta;
            }

            if (headingTauSec > 0) {
                const ah = alphaFromTau(headingTauSec, dtSec);
                sh = sh + delta * ah;
            } else {
                sh = sh + delta; // 즉시 반영
            }
            // 0..360 정규화
            if (sh < 0) sh += 360;
            else if (sh >= 360) sh -= 360;

            if (now - lastVisualPushRef.current >= visualIntervalMs) {
                lastVisualPushRef.current = now;
                setProgress(p);
                setPose({ x: sx, y: sy, heading: sh });
            }

            if (ts >= tN) {
                setState("finished");
                setProgress(1);
                rafRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [
        state,
        progress,
        logicalTsFromProgress,
        t0,
        tN,
        total,
        getPoseAt,
        posTauSec,
        headingTauSec,
        maxTurnRateDps,
        pose.x,
        pose.y,
        pose.heading,
    ]);

    const pause = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pausedTsRef.current = logicalTsFromProgress(progress);
        setState("paused");
    }, [progress, logicalTsFromProgress]);

    const reset = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pausedTsRef.current = null;
        setProgress(0);
        setState("idle");
    }, []);

    useEffect(
        () => () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        },
        []
    );

    return {
        state,
        progress,
        position: pose,
        play,
        pause,
        reset,
        durationMs: total,
    };
}
