import { useEffect, useMemo, useState } from "react";
import { Sample } from "../types";
import { buildVirtualTimeline, headingBetween } from "../utils";
import { PoseState, ReplayRefs, TimelineState } from "./types";

type UseReplayTimelineOptions = {
    timelineMode: "distance" | "pace";
};

type UseReplayTimelineResult = {
    timeline: TimelineState;
    initialPose: PoseState;
};

/**
 * 타임라인 빌드 및 초기화를 담당하는 훅
 * samples가 변경될 때 타임라인을 다시 빌드하고 refs를 초기화합니다.
 */
export function useReplayTimeline(
    samples: Sample[],
    totalDistance: number,
    refs: ReplayRefs,
    options: UseReplayTimelineOptions
): UseReplayTimelineResult {
    const { timelineMode } = options;
    const virtualDurationMs = totalDistance * 5;

    const [timeline, setTimeline] = useState<TimelineState>({
        t0: 0,
        tN: 0,
        total: 1,
        isReady: false,
    });

    // 초기 포즈 계산
    const initialPose = useMemo<PoseState>(() => {
        if (samples.length === 0) {
            return { x: 0, y: 0, heading: 0 };
        }
        const a = samples[0];
        const b = samples[1] ?? a;
        return {
            x: a.x,
            y: a.y,
            heading: headingBetween(a, b),
        };
    }, [samples]);

    // 타임라인 빌드 및 refs 초기화
    useEffect(() => {
        // 진행 중인 애니메이션 정리
        if (refs.raf.current) {
            cancelAnimationFrame(refs.raf.current);
            refs.raf.current = null;
        }
        refs.pausedTs.current = null;

        if (samples.length === 0) {
            refs.timelineT.current = [0];
            refs.currLogicalTs.current = 0;
            refs.smoothX.current = 0;
            refs.smoothY.current = 0;
            refs.smoothH.current = 0;
            refs.lastVisualPush.current = 0;

            setTimeline({
                t0: 0,
                tN: 0,
                total: 1,
                isReady: false,
            });
            return;
        }

        // 타임라인 빌드
        const tl = buildVirtualTimeline(samples, totalDistance, {
            mode: timelineMode,
            virtualDurationMs,
        });

        refs.timelineT.current = tl.T;
        refs.currLogicalTs.current = tl.t0;
        refs.smoothX.current = initialPose.x;
        refs.smoothY.current = initialPose.y;
        refs.smoothH.current = initialPose.heading;
        refs.lastVisualPush.current = 0;

        const total = Math.max(1, tl.tN - tl.t0);
        setTimeline({
            t0: tl.t0,
            tN: tl.tN,
            total,
            isReady: tl.tN > 0,
        });
    }, [samples, totalDistance, timelineMode, virtualDurationMs, initialPose, refs]);

    return { timeline, initialPose };
}
