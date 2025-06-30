interface RunningBase {
    runningName: string;
    mode: "SOLO" | "GHOST";
    startedAt: number;
    record: RunRecord;
    hasPaused: boolean;
    isPublic: boolean;
    telemetries: Telemetry[];
}

interface SoloRunning extends RunningBase {
    mode: "SOLO";
}

interface CourseRunning extends RunningBase {
    mode: "SOLO";
    ghostRunningId: null;
}

interface GhostRunning extends RunningBase {
    mode: "GHOST";
    ghostRunningId: number;
}

type Running = SoloRunning | CourseRunning | GhostRunning;

interface RunRecord {
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    duration: number;
    avgPace: number;
    calories: number;
    avgBpm: number;
    avgCadence: number;
}

interface Telemetry {
    timeStamp: string;
    lat: number;
    lng: number;
    dist: number;
    pace: number;
    alt: number;
    cadence: number;
    bpm: number;
    isRunning: boolean;
}
