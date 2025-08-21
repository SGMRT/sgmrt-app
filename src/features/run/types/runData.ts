export type RawRunData = {
    timestamp: number;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    speed: number | null;
    pressure: number | null;
    steps: number | null;
    distance: number;
    isRunning: boolean | null;
};
