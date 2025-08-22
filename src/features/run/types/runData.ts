export type RawRunData = {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    pressure: number | null;
    steps: number | null;
    distance: number;
    isRunning: boolean | null;
    raw: {
        timestamp: number;
        latitude: number;
        longitude: number;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        speed: number | null;
        pressure: number | null;
    };
};
