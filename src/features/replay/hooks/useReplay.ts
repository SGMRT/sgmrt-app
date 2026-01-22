import { useCallback, useEffect, useRef, useState } from "react";
import { PlayState, ReplayOptions, ReplayStats, Sample } from "../types";
import {
    alphaFromTau,
    buildVirtualTimeline,
    headingBetween,
    lerp,
    norm180,
} from "../utils";

export function useReplay(
    totalDistance: number,
    samples: Sample[],
    opts: ReplayOptions = {}
) {
    const {
        headingTauSec = 0.1,
        maxTurnRateDps = 180,
        visualFps = 60,
        timeScale = 0.95,
        timelineMode = "distance",
    } = opts;

    let virtualDurationMs = totalDistance * 5;
    const visualIntervalMs = 1000 / visualFps;

    const timelineRef = useRef<{ T: number[] }>({
        T: [0],
    });

    const [state, setState] = useState<PlayState>("idle");
    const [stats, setStats] = useState<ReplayStats>({
        distanceM: 0,
        paceSec: 0,
        elevation: 0,
        cadenceSpm: 0,
        elapsedMs: 0,
        progress: 0,
    });
    const [progress, setProgress] = useState(0); // 0..1
    const [timeline, setTimeline] = useState({ t0: 0, tN: 0 });

    const t0 = timeline.t0;
    const tN = timeline.tN;
    const total = Math.max(1, tN - t0);


    const rafRef = useRef<number | null>(null);
    const baseTsRef = useRef<number>(0);
    const pausedTsRef = useRef<number | null>(null);
    const startWallRef = useRef<number>(0);
    const lastWallRef = useRef<number | null>(null);

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
            const T = timelineRef.current.T;
            const n = samples.length;
            if (n === 0)
                return { x: 0, y: 0, d: 0, p: 0, e: 0, c: 0, t: 0, heading: 0 };
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

            let lo = 0,
                hi = n - 1;
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
        },
        [samples]
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

            // 여기서 스로틀링 적용
            const now = performance.now();
            if (
                forcePush ||
                now - lastVisualPushRef.current >= visualIntervalMs
            ) {
                lastVisualPushRef.current = now;
                setProgress(p);
                setPose({ x: sx, y: sy, heading: sh });
                setStats({
                    distanceM: raw.d,
                    paceSec: raw.p,
                    elevation: raw.e,
                    cadenceSpm: raw.c,
                    elapsedMs: ts - t0,
                    progress: p,
                });
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
        // 타임라인이 아직 준비되지 않았으면 무시
        if (tN === 0 || samples.length === 0) return;

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
            const elapsed = (now - startWallRef.current) * timeScale;
            const ts = baseTsRef.current + elapsed;
            const dtMs = Math.max(0, ts - currLogicalTsRef.current);

            if (dtMs > 0) advanceBy(dtMs);
            if (currLogicalTsRef.current >= tN) {
                setState("finished");
                setProgress(1);
                rafRef.current = null;
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [advanceBy, logicalTsFromProgress, progress, samples.length, state, tN]);

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
        setStats({
            distanceM: a?.d ?? 0,
            paceSec: a?.p ?? 0,
            elevation: a?.e ?? 0,
            cadenceSpm: a?.c ?? 0,
            elapsedMs: t0,
            progress: 0,
        });
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
    const frameMs = visualIntervalMs;

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
            rafRef.current = null;
            setState("idle");
        },
        []
    );

    useEffect(() => {
        // 러닝 중이면 멈추기
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pausedTsRef.current = null;

        // samples가 비어있으면 기본값으로 초기화
        if (samples.length === 0) {
            timelineRef.current = { T: [0] };
            setTimeline({ t0: 0, tN: 0 });
            currLogicalTsRef.current = 0;
            smoothXRef.current = 0;
            smoothYRef.current = 0;
            smoothHRef.current = 0;
            setProgress(0);
            setPose({ x: 0, y: 0, heading: 0 });
            setStats({
                distanceM: 0,
                paceSec: 0,
                elevation: 0,
                cadenceSpm: 0,
                elapsedMs: 0,
                progress: 0,
            });
            setState("idle");
            lastVisualPushRef.current = 0;
            return;
        }

        // 타임라인 빌드
        const tl = buildVirtualTimeline(samples, totalDistance, {
            mode: timelineMode,
            virtualDurationMs: virtualDurationMs,
        });
        timelineRef.current = { T: tl.T };
        setTimeline({ t0: tl.t0, tN: tl.tN });

        // samples가 채워졌다면 첫 포인트 기반으로 재초기화
        const a = samples[0];
        const b = samples[1] ?? a;
        const h0 = headingBetween(a, b);

        currLogicalTsRef.current = tl.t0;
        smoothXRef.current = a.x;
        smoothYRef.current = a.y;
        smoothHRef.current = h0;

        setProgress(0);
        setPose({ x: a.x, y: a.y, heading: h0 });
        setStats({
            distanceM: a.d ?? 0,
            paceSec: a.p ?? 0,
            elevation: a.e ?? 0,
            cadenceSpm: a.c ?? 0,
            elapsedMs: 0,
            progress: 0,
        });
        setState("idle");
        lastVisualPushRef.current = 0;
    }, [samples, totalDistance, timelineMode, virtualDurationMs]);

    const isReady = tN > 0 && samples.length > 0;

    return {
        state,
        progress,
        position: pose,
        play,
        pause,
        reset,
        stats,
        durationMs: total,
        isReady,
        // 새로 추가된 단일-프레임 컨트롤
        stepForward,
        stepBackward,
        stepByFrames,
        seekToProgress,
        // 디버깅/외부 표시용
        currentTimestamp: currLogicalTsRef.current,
        frameMs,
        visualFps,
    };
}
