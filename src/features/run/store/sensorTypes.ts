export type Ms = number; // epoch time in milliseconds

export interface LocationSample {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    speed: number | null;
    course: number | null;
    timestamp: Ms;
}

export interface PressureSample {
    pressure: number;
    timestamp: Ms;
}

export interface StepSample {
    totalSteps: number;
    timestamp: Ms;
}

export function ensureTs(inputTs?: number | null): Ms {
    return typeof inputTs === "number" && isFinite(inputTs)
        ? inputTs
        : Date.now();
}
