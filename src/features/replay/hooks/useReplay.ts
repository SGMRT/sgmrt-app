import { useCallback, useEffect, useRef, useState } from "react";
import { PlayState, ReplayOptions, ReplayStats, Sample } from "../types";
import { buildVirtualTimeline, headingBetween } from "../utils";
import { applySmoothingToPosition, getPoseAtTimestamp } from "../utils/index";

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
            return getPoseAtTimestamp(
                ts,
                samples,
                timelineRef.current.T,
                t0,
                tN
            );
        },
        [samples, t0, tN]
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
            const dtSec = Math.abs(dtMs) / 1000;

            // 스무딩 적용
            const prevSmooth = {
                x: smoothXRef.current,
                y: smoothYRef.current,
                heading: smoothHRef.current,
            };
            const smoothed = applySmoothingToPosition(raw, prevSmooth, dtSec, {
                posDeadbandUnits: opts.posDeadbandUnits,
                maxPosSpeedUnitsPerSec: opts.maxPosSpeedUnitsPerSec,
                posTauSec: opts.posTauSec,
                headingTauSec,
                maxTurnRateDps,
            });

            smoothXRef.current = smoothed.x;
            smoothYRef.current = smoothed.y;
            smoothHRef.current = smoothed.heading;
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
                setPose(smoothed);
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
