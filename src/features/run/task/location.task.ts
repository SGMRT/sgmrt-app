import { devLog } from "@/src/utils/devLog";
import type { LocationObject } from "expo-location";
import { Barometer } from "expo-sensors";
import { getStepCountAsync } from "expo-sensors/build/Pedometer";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TASK, MAX_ACCURACY_METERS } from "../constants";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { SensorStore, sharedSensorStore } from "../store/sensorStore";
import { StepSample } from "../store/sensorTypes";
import { geoFilter } from "../utils/geoFilter";
import { haversineMeters } from "../utils/haversineMeters";
import { pressureAltitudeM } from "../utils/pressureAltitudeM";

const joiner = new StreamJoiner(sharedSensorStore, 3000);

let lastAcceptedTs = 0;
let lastAcceptedLat = 0;
let lastAcceptedLng = 0;

let lastAcceptedPressure: number | null = null;
let lastAcceptedSteps: StepSample | null = null;
let lastAcceptedHeartRate: number | null = null;

function isFirstSample(sharedSensorStore: SensorStore) {
    return sharedSensorStore.locations.last() === undefined;
}

function reset() {
    lastAcceptedTs = 0;
    lastAcceptedLat = 0;
    lastAcceptedLng = 0;
    lastAcceptedPressure = null;
    lastAcceptedSteps = null;
    lastAcceptedHeartRate = null;
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const { locations } = (data ?? {}) as { locations?: LocationObject[] };
    if (!locations?.length) return;

    locations.sort((a, b) => a.timestamp - b.timestamp);

    if (isFirstSample(sharedSensorStore)) {
        devLog("[LOCATION] 첫 샘플");
        reset();
    }

    for (const loc of locations) {
        const { latitude, longitude, accuracy, altitude } = loc.coords;

        if (accuracy != null && accuracy > MAX_ACCURACY_METERS && !__DEV__) {
            devLog("[LOCATION] 위치 불확실성 높음", accuracy);
            continue;
        }

        const filtered = geoFilter.process(
            latitude,
            longitude,
            accuracy ?? 10,
            loc.timestamp,
            loc.coords.speed ?? 0
        );

        let deltaDistance = 0;
        if (lastAcceptedTs > 0) {
            deltaDistance = haversineMeters(
                lastAcceptedLat,
                lastAcceptedLng,
                filtered.latitude,
                filtered.longitude
            );
        }

        const sample = sharedSensorStore.pushLocation(loc);
        const joined = joiner.onNewLocation(sample);

        if (joined.pressure?.pressure != null) {
            lastAcceptedPressure = joined.pressure.pressure;
        } else if (lastAcceptedPressure != null) {
            joined.pressure = {
                pressure: lastAcceptedPressure,
                timestamp: joined.timestamp,
            };
        }

        const stepDiff =
            joined.steps?.totalSteps != null
                ? joined.steps.totalSteps - (lastAcceptedSteps?.totalSteps ?? 0)
                : 0;

        if (joined.steps?.totalSteps != null) {
            lastAcceptedSteps = joined.steps;
        } else if (lastAcceptedSteps != null) {
            joined.steps = lastAcceptedSteps;
        }

        if (joined.heartRate?.bpm != null) {
            lastAcceptedHeartRate = joined.heartRate.bpm;
        } else if (lastAcceptedHeartRate != null) {
            joined.heartRate = {
                bpm: lastAcceptedHeartRate,
                timestamp: joined.timestamp,
            };
        }

        const isBaroAvailable = await Barometer.isAvailableAsync();

        if (isBaroAvailable && !joined.pressure?.pressure) {
            devLog("[LOCATION] 압력 데이터 없음");
            continue;
        }

        const pressureAltitude = pressureAltitudeM(
            joined.pressure?.pressure,
            joined.location.altitude
        );

        const last5sSteps = await getStepCountAsync(
            new Date(joined.timestamp - 10000),
            new Date(joined.timestamp - 5000)
        )
            .then((steps) => steps.steps)
            .catch(() => 0);

        joinedState.push({
            timestamp: joined.timestamp,
            latitude: filtered.latitude,
            longitude: filtered.longitude,
            altitude: pressureAltitude ?? joined.location.altitude ?? null,
            pressure: joined.pressure?.pressure ?? null,
            steps: joined.steps
                ? {
                      totalSteps: joined.steps.totalSteps,
                      deltaSteps: stepDiff,
                      last5sSteps: last5sSteps,
                      timestamp: joined.steps.timestamp,
                  }
                : null,
            distance: deltaDistance,
            isRunning: null,
            bpm: joined.heartRate?.bpm ?? null,
            raw: {
                timestamp: joined.timestamp,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitudeAccuracy: joined.location.altitudeAccuracy,
                speed: joined.location.speed,
                course: joined.location.course,
                pressure: joined.pressure?.pressure ?? null,
            },
        });

        lastAcceptedTs = joined.timestamp;
        lastAcceptedLat = filtered.latitude;
        lastAcceptedLng = filtered.longitude;
    }
});
