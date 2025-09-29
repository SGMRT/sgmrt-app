import { MATCH_WINDOW_MS } from "../constants";
import { SensorStore } from "./sensorStore";
import {
    HeartRateSample,
    LocationSample,
    PressureSample,
    StepSample,
} from "./sensorTypes";

export interface JoinedSample {
    timestamp: number;
    location: LocationSample;
    pressure?: PressureSample;
    steps?: StepSample;
    heartRate?: HeartRateSample;
}

export class StreamJoiner {
    constructor(
        private readonly store: SensorStore,
        private readonly matchWindowMs = MATCH_WINDOW_MS
    ) {}

    onNewLocation(location: LocationSample) {
        const ts = location.timestamp;
        const steps = this.store.steps.closest(ts, this.matchWindowMs);
        const pressure = this.store.pressures.closest(ts, this.matchWindowMs);
        const heartRate = this.store.heartRates.closest(ts, this.matchWindowMs);
        return {
            timestamp: ts,
            location,
            pressure,
            steps,
            heartRate,
        };
    }
}
