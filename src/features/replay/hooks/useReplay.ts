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
// 두 점 사이의 헤딩 계산 (0°=북쪽 기준)
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
    const { headingTauSec = 0.3, maxTurnRateDps = 180, visualFps = 24 } = opts;

    const visualIntervalMs = 1000 / visualFps;

    const [state, setState] = useState<PlayState>("idle");
    const [progress, setProgress] = useState(0); // 0..1

    const hasTime =
        samples.length > 1 && typeof samples[0].timeStamp === "number";
    const t0 = hasTime ? (samples[0].timeStamp as number) : 0;
    const tN = hasTime
        ? (samples[samples.length - 1].timeStamp as number)
        : (samples.length - 1) * (1000 / 60);
    const total = Math.max(1, tN - t0);

    // ----- 재생 상태 refs -----
    const rafRef = useRef<number | null>(null);
    const baseTsRef = useRef<number>(0); // 재생 시작 시점의 논리 시간
    const pausedTsRef = useRef<number | null>(null);
    const startWallRef = useRef<number>(0);
    const lastWallRef = useRef<number | null>(null);

    // 단일-틱/스텝을 위한 “현재 논리 시간”과 “스무딩 포즈”를 refs로 유지
    const currLogicalTsRef = useRef<number>(t0);
    const smoothXRef = useRef<number>(samples[0]?.x ?? 0);
    const smoothYRef = useRef<number>(samples[0]?.y ?? 0);
    const smoothHRef = useRef<number>(
        samples.length > 1
            ? headingBetween(samples[0], samples[1] ?? samples[0])
            : 0
    );

    const lastVisualPushRef = useRef<number>(0);

    const [pose, setPose] = useState(() => {
        if (samples.length > 0) {
            const a = samples[0];
            const b = samples[1] ?? a;
            return { x: a.x, y: a.y, heading: headingBetween(a, b) };
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
                // 60Hz 가정 시퀀스
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

    // ----- 단일 틱(앞/뒤) 공용 로직 -----
    const advanceBy = useCallback(
        (dtMs: number, forcePush = false) => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;

            let ts = currLogicalTsRef.current + dtMs;

            if (ts <= t0) {
                ts = t0;
                setState("idle");
            } else if (ts >= tN) {
                ts = tN;
                setState("finished");
            }

            const raw = getPoseAt(ts);

            // 이전 스무딩 포즈 불러오기
            let sx = smoothXRef.current;
            let sy = smoothYRef.current;
            let sh = smoothHRef.current;

            // dtSec은 "논리적 스텝 크기"에 해당
            const dtSec = Math.abs(dtMs) / 1000;

            // 1) 데드밴드
            const dx = raw.x - sx;
            const dy = raw.y - sy;
            const dist = Math.hypot(dx, dy);
            const dead = opts.posDeadbandUnits ?? 0;
            let tx = raw.x,
                ty = raw.y;
            if (dead > 0 && dist < dead) {
                tx = sx;
                ty = sy;
            }

            // 2) 속도 캡 (좌표단위/초)
            const maxV = opts.maxPosSpeedUnitsPerSec ?? 0;
            if (maxV > 0 && dtSec > 0) {
                const maxStep = maxV * dtSec;
                const mx = tx - sx,
                    my = ty - sy;
                const mDist = Math.hypot(mx, my);
                if (mDist > maxStep) {
                    const k = maxStep / mDist;
                    tx = sx + mx * k;
                    ty = sy + my * k;
                }
            }

            // 3) 좌표 EMA 스무딩
            const posTau = opts.posTauSec ?? 0.12;
            if (posTau > 0) {
                const a = 1 - Math.exp(-dtSec / posTau);
                sx = sx + (tx - sx) * a;
                sy = sy + (ty - sy) * a;
            } else {
                sx = tx;
                sy = ty;
            }

            // 4) 헤딩 스무딩 (+ 회전속도 캡)
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
                sh = sh + delta;
            }
            if (sh < 0) sh += 360;
            else if (sh >= 360) sh -= 360;

            smoothXRef.current = sx;
            smoothYRef.current = sy;
            smoothHRef.current = sh;
            currLogicalTsRef.current = ts;

            const p = (ts - t0) / total;

            // 🔑 여기서 스로틀링 적용
            const now = performance.now();
            if (
                forcePush ||
                now - lastVisualPushRef.current >= visualIntervalMs
            ) {
                lastVisualPushRef.current = now;
                setProgress(p);
                setPose({ x: sx, y: sy, heading: sh });
            }
        },
        [
            getPoseAt,
            headingTauSec,
            maxTurnRateDps,
            opts.posDeadbandUnits,
            opts.maxPosSpeedUnitsPerSec,
            opts.posTauSec,
            t0,
            tN,
            total,
            visualIntervalMs,
        ]
    );

    // ----- 재생 -----
    const play = useCallback(() => {
        if (state === "playing") return;

        const now = performance.now();
        baseTsRef.current =
            pausedTsRef.current ?? logicalTsFromProgress(progress);
        pausedTsRef.current = null;
        startWallRef.current = now;
        lastWallRef.current = now;

        // 스텝/플레이 타임라인 동기화
        currLogicalTsRef.current = baseTsRef.current;

        setState("playing");

        const tick = () => {
            const now = performance.now();
            const elapsed = now - startWallRef.current;
            const dtSec = Math.max(
                0,
                (now - (lastWallRef.current ?? now)) / 1000
            );
            lastWallRef.current = now;

            const ts = baseTsRef.current + elapsed;

            // 한 프레임 분량 경과만큼 advance 처리 (EMA/캡 동일하게)
            const dtMs = Math.max(0, ts - currLogicalTsRef.current);
            if (dtMs > 0) {
                advanceBy(dtMs);
            }

            if (currLogicalTsRef.current >= tN) {
                setState("finished");
                setProgress(1);
                rafRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [advanceBy, logicalTsFromProgress, progress, state, tN]);

    const pause = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pausedTsRef.current = currLogicalTsRef.current;
        setState("paused");
    }, []);

    const reset = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pausedTsRef.current = null;

        const a = samples[0];
        const b = samples[1] ?? a;
        const h0 = a && b ? headingBetween(a, b) : 0;

        currLogicalTsRef.current = t0;
        smoothXRef.current = a?.x ?? 0;
        smoothYRef.current = a?.y ?? 0;
        smoothHRef.current = h0;

        setProgress(0);
        setPose({
            x: smoothXRef.current,
            y: smoothYRef.current,
            heading: smoothHRef.current,
        });
        lastVisualPushRef.current = 0;
        setState("idle");
    }, [samples, t0]);

    // ----- 스텝 API -----
    // “한 프레임”의 논리적 길이 (타임스탬프가 없으면 60Hz 기준)
    const frameMs = hasTime ? visualIntervalMs : 1000 / 60;

    const stepForward = useCallback(() => {
        advanceBy(frameMs);
    }, [advanceBy, frameMs]);

    const stepBackward = useCallback(() => {
        advanceBy(-frameMs);
    }, [advanceBy, frameMs]);

    const stepByFrames = useCallback(
        (n: number) => {
            if (!Number.isFinite(n) || n === 0) return;
            advanceBy(frameMs * n);
        },
        [advanceBy, frameMs]
    );

    const seekToProgress = useCallback(
        (p: number) => {
            const clamped = Math.min(1, Math.max(0, p));
            const targetTs = logicalTsFromProgress(clamped);
            // 큰 점프도 동일 로직으로 스무딩 적용하려면 advanceBy 사용
            const dt = targetTs - currLogicalTsRef.current;
            advanceBy(dt);
        },
        [advanceBy, logicalTsFromProgress]
    );

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
        // 새로 추가된 단일-프레임 컨트롤
        stepForward,
        stepBackward,
        stepByFrames,
        seekToProgress,
        // 디버깅/외부 표시용
        currentTimestamp: currLogicalTsRef.current,
        frameMs,
    };
}
