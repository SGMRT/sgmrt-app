export interface BaseRunning {
    runningName: string;
    startedAt: number;
    record: RunRecord;
    hasPaused: boolean;
    isPublic: boolean;
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

export interface PostRunRequest {
    req: Running;
    rawTelemetry: string;
    interpolatedTelemetry: string;
    screenShotImage: string;
}

export interface SoloRunGetResponse {
    startedAt: number;
    runningName: string;
    telemetryUrl: string;
    telemetries: Telemetry[];
    isPublic: boolean;
    courseInfo: CourseInfo;
    recordInfo: RecordInfo;
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
    runnersCount?: number;
    isPublic?: boolean;
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
    elevationAverage: number;
}

export type RunsRequest = {
    filteredBy: "DATE" | "COURSE";
    runningMode: "SOLO" | "GHOST";
    startEpoch: number;
    endEpoch: number;
    cursorRunningId: number | null;
    cursorStartedAt: number | null;
    cursorCourseName: string | null;
};

export type RunResponse = {
    runningId: number;
    name: string;
    startedAt: number;
    recordInfo: {
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
        elevationAverage: number;
    };
    courseInfo: {
        id: number;
        name: string | null;
        isPublic: boolean;
    } | null;
    ghostRunningId: number | null;
    screenShotUrl: string | null;
};
