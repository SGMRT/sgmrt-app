export const LOCATION_TASK = "running-session";
export interface RunData {
    timestamp: number;
    timeDiff: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed: number | null;
    totalSteps: number | null;
    deltaSteps: number | null;
    runStatus: RunnningStatus;
    raw: {
        latitude: number;
        longitude: number;
    };
}
export type RunnningStatus =
    | "before_running"
    | "ready_course_running"
    | "start_running"
    | "pause_running"
    | "stop_running"
    | "complete_course_running";

export interface UserDashBoardData {
    totalDistance: number;
    totalCalories: number;
    averagePace: number;
    averageCadence: number;
    recentPointsPace: number;
    bpm: number;
    totalElevationGain: number;
    totalElevationLoss: number;
}

export interface StepCount {
    totalSteps: number;
    timestamp: number;
}

export interface Altitude {
    pressure: number;
    altitude: number;
    timestamp: number;
}
