import { Telemetry } from "./run";

export interface CoursesRequest {
    lat: number;
    lng: number;
    radiusM?: number;
    sort?: "DISTANCE" | "POPULARITY";
    ownerUuid?: string;
    minDistance?: number;
    maxDistance?: number;
    minElevationM?: number;
    maxElevationM?: number;
}

export interface CourseResponse {
    id: number;
    name: string;
    sourse: "USER" | "OFFICIAL";
    startLat: number;
    startLng: number;
    routeUrl: string;
    checkpointsUrl: string;
    thumbnailUrl: string;
    distance: number;
    elevationAverage: number;
    elevationGain: number;
    elevationLoss: number;
    createdAt: Date;
    myGhostInfo: {
        runnerUuid: string;
        runnerProfileUrl: string;
        runnerNickname: string;
        runningId: number;
        runningName: string;
        averagePace: number;
        cadence: number;
        bpm: number;
        duration: number;
        isPublic: boolean;
        startedAt: Date;
    };
    runners: [
        {
            uuId: string;
            profileUrl: string;
        }
    ];
    runnersCount: number;
    telemetries: Telemetry[];
}

export type Checkpoint = {
    lat: number;
    lng: number;
    angle: number;
};

export interface CourseDetailResponse {
    id: number;
    name: string;
    telemetryUrl: string;
    checkpointsUrl: string;
    distance: number;
    elevationAverage: number;
    elevationGain: number;
    elevationLoss: number;
    createdAt: number;
    averageCompletionTime: number;
    averageFinisherPace: number;
    averageFinisherCadence: number;
    averageCaloriesBurned: number;
    lowestFinisherPace: number;
    uniqueRunnersCount: number;
    totalRunsCount: number;
    myLowestPace: number;
    myAveragePace: number;
    myHighestPace: number;
    myGhostInfo: {
        runnerUuid: string;
        runnerProfileUrl: string;
        runnerNickname: string;
        runningId: number;
        runningName: string;
        averagePace: number;
        cadence: number;
        bpm: number;
        duration: number;
        isPublic: boolean;
        startedAt: Date;
    };
    telemetries: Telemetry[];
    courseCheckpoints: Checkpoint[];
}

export interface PathData {
    lat: number;
    lng: number;
}

export interface HistoryResponse {
    rank?: number;
    runnerUuid: string;
    runnerProfileUrl: string;
    runnerNickname: string;
    runningId: number;
    runningName: string;
    averagePace: number;
    cadence: number;
    bpm: number;
    duration: number;
    isPublic: boolean;
    startedAt: string;
}

// export interface UserRankResponse {
//     rank: number;
//     runningId: number;
//     runningName: string;
//     duration: number;
//     bpm: number;
//     averagePace: number;
//     runnerProfileUrl: string;
// }

export interface UserCourseInfo {
    id: number;
    name: string;
    createdAt: number;
    totalRunsCount: number;
    distance: number;
    averageCompletionTime: number;
    averageFinisherPace: number;
    averageFinisherCadence: number;
    isPublic: boolean;
    thumbnailUrl: string;
}

export type Pageable = {
    page: number;
    size: number;
    sort: GhostSortOption;
};

export type GhostSortField =
    | "id"
    | "runningRecord.averagePace"
    | "runningRecord.duration"
    | "runningRecord.cadence";

export type SortOrder = "asc" | "desc";

export type GhostSortOption = `${GhostSortField},${SortOrder}`;
