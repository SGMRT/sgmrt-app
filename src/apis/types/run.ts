export interface BaseRunning {
    runningName: string;
    startedAt: number;
    record: RunRecord;
    hasPaused: boolean;
    isPublic: boolean;
    telemetries: Telemetry[];
}

export interface CourseSoloRunning extends BaseRunning {
    mode: "SOLO";
    ghostRunningId: null;
}

export interface CourseGhostRunning extends BaseRunning {
    mode: "GHOST";
    ghostRunningId: number;
}

export type Running = BaseRunning | CourseSoloRunning | CourseGhostRunning;

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

export type RunsRequest = {
    runningMode: "SOLO" | "GHOST";
    cursorStartedAt: string | null;
    cursorRunningId: number | null;
};

export type RunResponse = {
    runningId: number;
    name: string;
    startedAt: string;
    recordInfo: {
        distance: number;
        duration: number;
        cadence: number;
        averagePace: number;
    };
    courseInfo: {
        id: number | null;
        name: string | null;
    };
};
