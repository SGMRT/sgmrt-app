interface RunningBase {
    runningName: string;
    mode: "SOLO" | "GHOST";
    startedAt: number;
    record: RunRecord;
    hasPaused: boolean;
    isPublic: boolean;
    telemetries: Telemetry[];
}

export interface SoloRunning extends RunningBase {
    mode: "SOLO";
}

export interface CourseRunning extends RunningBase {
    mode: "SOLO";
    ghostRunningId: null;
}

export interface GhostRunning extends RunningBase {
    mode: "GHOST";
    ghostRunningId: number;
}

export type Running = SoloRunning | CourseRunning | GhostRunning;

export interface RunRecord {
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    duration: number;
    avgPace: number;
    calories: number;
    avgBpm: number;
    avgCadence: number;
}

export interface Telemetry {
    timeStamp: number;
    lat: number;
    lng: number;
    dist: number;
    pace: number;
    alt: number;
    cadence: number;
    bpm: number;
    isRunning: boolean;
}
