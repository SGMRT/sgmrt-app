import { useRef } from "react";
import { ReplayOptions, Sample } from "../types";
import { createReplayRefs } from "./types";
import { useReplayControls } from "./useReplayControls";
import { useReplayTimeline } from "./useReplayTimeline";

/**
 * 코스 리플레이를 위한 메인 훅
 *
 * 내부적으로 세 개의 서브 훅을 조합합니다:
 * - useReplayTimeline: 타임라인 빌드 및 초기화
 * - useReplayAnimation: 위치 보간 및 스무딩
 * - useReplayControls: 재생 컨트롤 (play/pause/seek)
 */
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
        posDeadbandUnits = 0,
        maxPosSpeedUnitsPerSec = 0,
        posTauSec = 0.12,
    } = opts;

    const visualIntervalMs = 1000 / visualFps;

    // refs는 한 번만 생성하고 계속 사용
    const refsRef = useRef(createReplayRefs());
    const refs = refsRef.current;

    // 타임라인 빌드 및 초기화
    const { timeline, initialPose } = useReplayTimeline(
        samples,
        totalDistance,
        refs,
        { timelineMode }
    );

    // 스무딩 설정
    const smoothingConfig = {
        headingTauSec,
        maxTurnRateDps,
        posDeadbandUnits,
        maxPosSpeedUnitsPerSec,
        posTauSec,
    };

    // 애니메이션 설정
    const animationConfig = {
        visualFps,
        visualIntervalMs,
        timeScale,
    };

    // 재생 컨트롤
    const controls = useReplayControls(
        samples,
        refs,
        timeline,
        initialPose,
        smoothingConfig,
        animationConfig
    );

    return {
        state: controls.state,
        progress: controls.progress,
        position: controls.pose,
        play: controls.play,
        pause: controls.pause,
        reset: controls.reset,
        stats: controls.stats,
        durationMs: timeline.total,
        isReady: timeline.isReady && samples.length > 0,
        // 프레임 단위 컨트롤
        stepForward: controls.stepForward,
        stepBackward: controls.stepBackward,
        stepByFrames: controls.stepByFrames,
        seekToProgress: controls.seekToProgress,
        // 디버깅용
        currentTimestamp: refs.currLogicalTs.current,
        frameMs: visualIntervalMs,
        visualFps,
    };
}
