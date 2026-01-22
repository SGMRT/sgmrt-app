import { MutableRefObject } from "react";
import { PlayState, ReplayStats, Sample } from "../types";

/**
 * 리플레이 시스템에서 공유되는 ref들을 담는 컨텍스트
 * 여러 훅에서 동일한 refs를 참조하기 위해 사용
 */
export type ReplayRefs = {
    /** 현재 타임라인 배열 */
    timelineT: MutableRefObject<number[]>;
    /** 현재 논리적 타임스탬프 */
    currLogicalTs: MutableRefObject<number>;
    /** 스무딩된 X 좌표 */
    smoothX: MutableRefObject<number>;
    /** 스무딩된 Y 좌표 */
    smoothY: MutableRefObject<number>;
    /** 스무딩된 헤딩 */
    smoothH: MutableRefObject<number>;
    /** RAF ID */
    raf: MutableRefObject<number | null>;
    /** 재생 시작 기준 타임스탬프 */
    baseTs: MutableRefObject<number>;
    /** 일시정지 시점 타임스탬프 */
    pausedTs: MutableRefObject<number | null>;
    /** 재생 시작 wall clock */
    startWall: MutableRefObject<number>;
    /** 마지막 시각적 업데이트 시점 */
    lastVisualPush: MutableRefObject<number>;
};

/**
 * 타임라인 상태
 */
export type TimelineState = {
    t0: number;
    tN: number;
    total: number;
    isReady: boolean;
};

/**
 * 포즈 상태
 */
export type PoseState = {
    x: number;
    y: number;
    heading: number;
};

/**
 * 리플레이 옵션 (스무딩 관련)
 */
export type SmoothingConfig = {
    headingTauSec: number;
    maxTurnRateDps: number;
    posDeadbandUnits: number;
    maxPosSpeedUnitsPerSec: number;
    posTauSec: number;
};

/**
 * 애니메이션 설정
 */
export type AnimationConfig = {
    visualFps: number;
    visualIntervalMs: number;
    timeScale: number;
};

/**
 * refs 초기화 함수
 */
export function createReplayRefs(): ReplayRefs {
    return {
        timelineT: { current: [0] },
        currLogicalTs: { current: 0 },
        smoothX: { current: 0 },
        smoothY: { current: 0 },
        smoothH: { current: 0 },
        raf: { current: null },
        baseTs: { current: 0 },
        pausedTs: { current: null },
        startWall: { current: 0 },
        lastVisualPush: { current: 0 },
    };
}
