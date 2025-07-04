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
    pathData: string;
    distance: number;
    elevationGain: number;
    elevationLoss: number;
}
