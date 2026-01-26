import type { MovementState } from "../filters/types";

export type RawRunData = {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    pressure: number | null;
    steps: {
        totalSteps: number;
        deltaSteps: number;
        last5sSteps: number;
        timestamp: number;
    } | null;
    distance: number;
    isRunning: boolean | null;
    bpm: number | null;
    /** 이동 상태 (v2 파이프라인에서만 사용) */
    movementState?: MovementState;
    /** GPS 신뢰도 0-1 (v2 파이프라인에서만 사용) */
    confidence?: number;
    raw: {
        timestamp: number;
        latitude: number;
        longitude: number;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        speed: number | null;
        course: number | null;
        pressure: number | null;
    };
};
