import { LocationObject } from "expo-location";
import { BarometerMeasurement } from "expo-sensors";
import { PedometerResult } from "expo-sensors/build/Pedometer";
import {
    LOCATION_BUFFER_SIZE,
    PEDOMETER_BUFFER_SIZE,
    PRESSURE_BUFFER_SIZE,
} from "../constants";
import { RingBuffer } from "./ringBuffers";
import {
    ensureTs,
    LocationSample,
    PressureSample,
    StepSample,
} from "./sensorTypes";

export class SensorStore {
    readonly locations = new RingBuffer<LocationSample>(LOCATION_BUFFER_SIZE);
    readonly pressures = new RingBuffer<PressureSample>(PRESSURE_BUFFER_SIZE);
    readonly steps = new RingBuffer<StepSample>(PEDOMETER_BUFFER_SIZE);

    reset() {
        this.locations.reset();
        this.pressures.reset();
        this.steps.reset();
    }

    pushLocation(raw: LocationObject) {
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

    pushPressure(raw: BarometerMeasurement) {
        const sample: PressureSample = {
            pressure: raw.pressure,
            timestamp: ensureTs(raw.timestamp),
        };
        this.pressures.push(sample);
        return sample;
    }

    pushSteps(raw: PedometerResult & { timestamp: number }) {
        const sample: StepSample = {
            totalSteps: raw.steps,
            timestamp: ensureTs(raw.timestamp),
        };
        this.steps.push(sample);
        return sample;
    }
}

export const sharedSensorStore = new SensorStore();
