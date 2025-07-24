export const LOCATION_TASK = "running-session";
export interface RunData {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed: number | null;
    runStatus: RunnningStatus;
}
export type RunnningStatus =
    | "before_running"
    | "start_running"
    | "pause_running"
    | "stop_running";
