export const LOCATION_TASK = "running-session";
export interface RunData {
    timestamp: number;
    timeDiff: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed: number | null;
    steps: number | null;
    runStatus: RunnningStatus;
}
export type RunnningStatus =
    | "before_running"
    | "start_running"
    | "pause_running"
    | "stop_running";

export interface UserDashBoardData {
    totalDistance: number;
    totalCalories: number;
    averagePace: number;
    averageCadence: number;
    recentPointsPace: number;
    bpm: number;
}
