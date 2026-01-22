import { useCallback } from "react";
import { ReplayStats, Sample } from "../types";
import {
    applySmoothingToPosition,
    getProgressFromPosition,
    getPoseAtTimestamp,
} from "../utils/index";
import {
    AnimationConfig,
    PoseState,
    ReplayRefs,
    SmoothingConfig,
    TimelineState,
} from "./types";

type AdvanceResult = {
    pose: PoseState;
    stats: ReplayStats;
    progress: number;
    reachedEnd: boolean;
    reachedStart: boolean;
};

type UseReplayAnimationResult = {
    /**
     * 주어진 시간만큼 진행하고 새로운 상태를 반환
     * @param dtMs - 진행할 밀리초
     * @param forcePush - 스로틀링 무시 여부
     */
    advance: (dtMs: number, forcePush?: boolean) => AdvanceResult | null;
    /**
     * 특정 progress로 이동
     */
    seekTo: (progress: number) => AdvanceResult | null;
};

/**
 * 애니메이션 진행 로직을 담당하는 훅
 * 위치 보간과 스무딩을 처리합니다.
 */
export function useReplayAnimation(
    samples: Sample[],
    refs: ReplayRefs,
    timeline: TimelineState,
    smoothingConfig: SmoothingConfig,
    animationConfig: AnimationConfig
): UseReplayAnimationResult {
    const { t0, tN, total } = timeline;
    const { visualIntervalMs } = animationConfig;

    const advance = useCallback(
        (dtMs: number, forcePush = false): AdvanceResult | null => {
            let ts = refs.currLogicalTs.current + dtMs;
            let reachedEnd = false;
            let reachedStart = false;

            if (ts <= t0) {
                ts = t0;
                reachedStart = true;
            } else if (ts >= tN) {
                ts = tN;
                reachedEnd = true;
            }

            const raw = getPoseAtTimestamp(
                ts,
                samples,
                refs.timelineT.current,
                t0,
                tN
            );
            const dtSec = Math.abs(dtMs) / 1000;

            const prevSmooth: PoseState = {
                x: refs.smoothX.current,
                y: refs.smoothY.current,
                heading: refs.smoothH.current,
            };

            // 시작/끝 지점에서는 스무딩 없이 정확한 위치로 스냅
            const shouldSnapToExact = reachedEnd || reachedStart;

            const smoothed = shouldSnapToExact
                ? { x: raw.x, y: raw.y, heading: raw.heading }
                : applySmoothingToPosition(raw, prevSmooth, dtSec, {
                      posDeadbandUnits: smoothingConfig.posDeadbandUnits,
                      maxPosSpeedUnitsPerSec: smoothingConfig.maxPosSpeedUnitsPerSec,
                      posTauSec: smoothingConfig.posTauSec,
                      headingTauSec: smoothingConfig.headingTauSec,
                      maxTurnRateDps: smoothingConfig.maxTurnRateDps,
                  });

            // refs 업데이트
            refs.smoothX.current = smoothed.x;
            refs.smoothY.current = smoothed.y;
            refs.smoothH.current = smoothed.heading;
            refs.currLogicalTs.current = ts;

            // 시작/끝에서는 정확한 progress, 그 외는 position 기준
            const progress = reachedEnd
                ? 1
                : reachedStart
                  ? 0
                  : getProgressFromPosition(smoothed.x, smoothed.y, samples);

            // 스로틀링 체크
            const now = performance.now();
            if (!forcePush && now - refs.lastVisualPush.current < visualIntervalMs) {
                return null;
            }
            refs.lastVisualPush.current = now;

            return {
                pose: smoothed,
                stats: {
                    distanceM: raw.d,
                    paceSec: raw.p,
                    elevation: raw.e,
                    cadenceSpm: raw.c,
                    elapsedMs: ts - t0,
                    progress,
                },
                progress,
                reachedEnd,
                reachedStart,
            };
        },
        [samples, refs, t0, tN, total, smoothingConfig, visualIntervalMs]
    );

    const seekTo = useCallback(
        (targetProgress: number): AdvanceResult | null => {
            const clamped = Math.min(1, Math.max(0, targetProgress));
            const targetTs = Math.round(t0 + clamped * total);
            const dt = targetTs - refs.currLogicalTs.current;
            return advance(dt, true);
        },
        [advance, t0, total, refs]
    );

    return { advance, seekTo };
}
