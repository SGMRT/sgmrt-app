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

export interface SoloRunGetResponse {
    startedAt: number;
    runningName: string;
    courseInfo: CourseInfo;
    recordInfo: RecordInfo;
    telemetries: Telemetry[];
}

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

export interface CourseInfo {
    id: number;
    name: string;
    runnerCount: number;
}

export interface RecordInfo {
    distance: number;
    duration: number;
    cadence: number;
    bpm: number;
    calories: number;
    averagePace: number;
    highestPace: number;
    lowestPace: number;
    elevationGain: number;
    elevationLoss: number;
    totalElevation: number;
}
