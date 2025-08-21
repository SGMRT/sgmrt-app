import { LocationObject } from "expo-location";
import { BarometerMeasurement } from "expo-sensors";
import { PedometerResult } from "expo-sensors/build/Pedometer";
import { RingBuffer } from "./ringBuffers";
import {
    ensureTs,
    LocationSample,
    PressureSample,
    StepSample,
} from "./sensorTypes";

export class SensorStore {
    readonly locations = new RingBuffer<LocationSample>(100);
    readonly pressures = new RingBuffer<PressureSample>(100);
    readonly steps = new RingBuffer<StepSample>(100);

    ingestLocation(raw: LocationObject) {
        const sample: LocationSample = {
            latitude: raw.coords.latitude,
            longitude: raw.coords.longitude,
            accuracy: raw.coords.accuracy,
            altitude: raw.coords.altitude,
            altitudeAccuracy: raw.coords.altitudeAccuracy,
            speed: raw.coords.speed,
            timestamp: ensureTs(raw.timestamp),
        };
        this.locations.push(sample);
        return sample;
    }

    ingestPressure(raw: BarometerMeasurement) {
        const sample: PressureSample = {
            pressure: raw.pressure,
            timestamp: ensureTs(raw.timestamp),
        };
        this.pressures.push(sample);
        return sample;
    }

    ingestSteps(raw: PedometerResult) {
        const sample: StepSample = {
            totalSteps: raw.steps,
            timestamp: ensureTs(Date.now()),
        };
        this.steps.push(sample);
        return sample;
    }
}
