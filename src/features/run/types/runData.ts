export type RawRunData = {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    pressure: number | null;
    steps: {
        totalSteps: number;
        deltaSteps: number;
        last5sSteps: number;
        timestamp: number;
    } | null;
    distance: number;
    isRunning: boolean | null;
    bpm: number | null;
    raw: {
        timestamp: number;
        latitude: number;
        longitude: number;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        speed: number | null;
        course: number | null;
        pressure: number | null;
    };
};
