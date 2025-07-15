export interface CoursesRequest {
    lat: number;
    lng: number;
    radiusKm?: number;
    ownerId?: number;
}

export interface CourseResponse {
    id: number;
    name: string;
    startLat: number;
    startLng: number;
    pathData: PathData[];
    distance: number;
    elevationGain: number;
    elevationLoss: number;
}

export interface CourseDetailResponse {
    id: number;
    name: string;
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    averageCompletionTime: number;
    averageFinisherPace: number;
    averageFinisherCadence: number;
    lowestFinisherPace: number;
}

export interface PathData {
    lat: number;
    lng: number;
}

export interface HistoryResponse {
    rank?: number;
    runnerId: number;
    runnerProfileUrl: string;
    runningId: number;
    runningName: string;
    averagePace: number;
    cadence: number;
    bpm: number;
    duration: number;
    isPublic: boolean;
    startedAt: string;
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
