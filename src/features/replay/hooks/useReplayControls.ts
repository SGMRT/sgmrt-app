import { useCallback, useEffect, useRef, useState } from "react";
import { PlayState, ReplayStats, Sample } from "../types";
import { headingBetween } from "../utils";
import { useReplayAnimation } from "./useReplayAnimation";
import {
    AnimationConfig,
    PoseState,
    ReplayRefs,
    SmoothingConfig,
    TimelineState,
} from "./types";

type UseReplayControlsResult = {
    state: PlayState;
    progress: number;
    pose: PoseState;
    stats: ReplayStats;
    play: () => void;
    pause: () => void;
    reset: () => void;
    seekToProgress: (p: number) => void;
    stepForward: () => void;
    stepBackward: () => void;
    stepByFrames: (n: number) => void;
};

/**
 * 재생 컨트롤 로직을 담당하는 훅
 * play, pause, reset, seek 등의 컨트롤을 제공합니다.
 */
export function useReplayControls(
    samples: Sample[],
    refs: ReplayRefs,
    timeline: TimelineState,
    initialPose: PoseState,
    smoothingConfig: SmoothingConfig,
    animationConfig: AnimationConfig
): UseReplayControlsResult {
    const { t0, tN, isReady } = timeline;
    const { timeScale, visualIntervalMs } = animationConfig;
    const frameMs = visualIntervalMs;

    const [state, setState] = useState<PlayState>("idle");
    const [progress, setProgress] = useState(0);
    const [pose, setPose] = useState<PoseState>(initialPose);
    const [stats, setStats] = useState<ReplayStats>({
        distanceM: 0,
        paceSec: 0,
        elevation: 0,
        cadenceSpm: 0,
        elapsedMs: 0,
        progress: 0,
    });

    const { advance, seekTo } = useReplayAnimation(
        samples,
        refs,
        timeline,
        smoothingConfig,
        animationConfig
    );

    // samples나 timeline 변경 시 상태 리셋
    const prevSamplesRef = useRef(samples);
    useEffect(() => {
        if (prevSamplesRef.current !== samples) {
            prevSamplesRef.current = samples;
            setPose(initialPose);
            setProgress(0);
            setState("idle");
            if (samples.length > 0) {
                const a = samples[0];
                setStats({
                    distanceM: a.d ?? 0,
                    paceSec: a.p ?? 0,
                    elevation: a.e ?? 0,
                    cadenceSpm: a.c ?? 0,
                    elapsedMs: 0,
                    progress: 0,
                });
            }
        }
    }, [samples, initialPose]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (refs.raf.current) {
                cancelAnimationFrame(refs.raf.current);
                refs.raf.current = null;
            }
        };
    }, [refs]);

    const play = useCallback(() => {
        if (state === "playing") return;
        if (!isReady || samples.length === 0) return;

        const now = performance.now();
        refs.baseTs.current = refs.pausedTs.current ?? refs.currLogicalTs.current;
        refs.pausedTs.current = null;
        refs.startWall.current = now;
        refs.currLogicalTs.current = refs.baseTs.current;

        setState("playing");

        const tick = () => {
            const now = performance.now();
            const elapsed = (now - refs.startWall.current) * timeScale;
            const ts = refs.baseTs.current + elapsed;
            const dtMs = Math.max(0, ts - refs.currLogicalTs.current);

            if (dtMs > 0) {
                const result = advance(dtMs);
                if (result) {
                    setPose(result.pose);
                    setProgress(result.progress);
                    setStats(result.stats);

                    if (result.reachedEnd) {
                        setState("finished");
                        setProgress(1);
                        refs.raf.current = null;
                        return;
                    }
                }
            }

            if (refs.currLogicalTs.current >= tN) {
                setState("finished");
                setProgress(1);
                refs.raf.current = null;
                return;
            }

            refs.raf.current = requestAnimationFrame(tick);
        };

        refs.raf.current = requestAnimationFrame(tick);
    }, [state, isReady, samples.length, refs, timeScale, tN, advance]);

    const pause = useCallback(() => {
        if (refs.raf.current) {
            cancelAnimationFrame(refs.raf.current);
            refs.raf.current = null;
        }
        refs.pausedTs.current = refs.currLogicalTs.current;
        setState("paused");
    }, [refs]);

    const reset = useCallback(() => {
        if (refs.raf.current) {
            cancelAnimationFrame(refs.raf.current);
            refs.raf.current = null;
        }
        refs.pausedTs.current = null;
        refs.currLogicalTs.current = t0;
        refs.lastVisualPush.current = 0;

        if (samples.length > 0) {
            const a = samples[0];
            const b = samples[1] ?? a;
            const h0 = headingBetween(a, b);

            refs.smoothX.current = a.x;
            refs.smoothY.current = a.y;
            refs.smoothH.current = h0;

            setPose({ x: a.x, y: a.y, heading: h0 });
            setStats({
                distanceM: a.d ?? 0,
                paceSec: a.p ?? 0,
                elevation: a.e ?? 0,
                cadenceSpm: a.c ?? 0,
                elapsedMs: 0,
                progress: 0,
            });
        } else {
            refs.smoothX.current = 0;
            refs.smoothY.current = 0;
            refs.smoothH.current = 0;
            setPose({ x: 0, y: 0, heading: 0 });
            setStats({
                distanceM: 0,
                paceSec: 0,
                elevation: 0,
                cadenceSpm: 0,
                elapsedMs: 0,
                progress: 0,
            });
        }

        setProgress(0);
        setState("idle");
    }, [refs, t0, samples]);

    const seekToProgress = useCallback(
        (p: number) => {
            if (refs.raf.current) {
                cancelAnimationFrame(refs.raf.current);
                refs.raf.current = null;
            }

            const result = seekTo(p);
            if (result) {
                setPose(result.pose);
                setProgress(result.progress);
                setStats(result.stats);

                if (result.reachedEnd) {
                    setState("finished");
                } else if (result.reachedStart) {
                    setState("idle");
                }
            }
        },
        [refs, seekTo]
    );

    const stepForward = useCallback(() => {
        if (refs.raf.current) {
            cancelAnimationFrame(refs.raf.current);
            refs.raf.current = null;
        }

        const result = advance(frameMs, true);
        if (result) {
            setPose(result.pose);
            setProgress(result.progress);
            setStats(result.stats);

            if (result.reachedEnd) {
                setState("finished");
            }
        }
    }, [refs, advance, frameMs]);

    const stepBackward = useCallback(() => {
        if (refs.raf.current) {
            cancelAnimationFrame(refs.raf.current);
            refs.raf.current = null;
        }

        const result = advance(-frameMs, true);
        if (result) {
            setPose(result.pose);
            setProgress(result.progress);
            setStats(result.stats);

            if (result.reachedStart) {
                setState("idle");
            }
        }
    }, [refs, advance, frameMs]);

    const stepByFrames = useCallback(
        (n: number) => {
            if (!Number.isFinite(n) || n === 0) return;

            if (refs.raf.current) {
                cancelAnimationFrame(refs.raf.current);
                refs.raf.current = null;
            }

            const result = advance(frameMs * n, true);
            if (result) {
                setPose(result.pose);
                setProgress(result.progress);
                setStats(result.stats);

                if (result.reachedEnd) {
                    setState("finished");
                } else if (result.reachedStart) {
                    setState("idle");
                }
            }
        },
        [refs, advance, frameMs]
    );

    return {
        state,
        progress,
        pose,
        stats,
        play,
        pause,
        reset,
        seekToProgress,
        stepForward,
        stepBackward,
        stepByFrames,
    };
}
