type Sample = {
    x: number;
    y: number;
    d: number;
    p: number;
    e: number;
    c: number;
    t: number;
};
type ReplayStats = {
    distanceM: number;
    paceSec: number;
    elevation: number;
    cadenceSpm: number;
    elapsedMs: number;
    progress: number;
};
type PlayState = "idle" | "playing" | "paused" | "finished";

type ReplayOptions = {
    posTauSec?: number; // 좌표 스무딩 시간상수
    headingTauSec?: number; // 헤딩 스무딩 시간상수
    maxTurnRateDps?: number; // 최대 회전 속도
    posDeadbandUnits?: number; // 좌표 데드밴드
    maxPosSpeedUnitsPerSec?: number; // 최대 속도
    visualFps?: number; // 업데이트 FPS
    timeScale?: number; // 시간 스케일
};

export type { PlayState, ReplayOptions, ReplayStats, Sample };
