// features/run/background/location.task.ts
import { devLog } from "@/src/utils/devLog";
import type { LocationObject } from "expo-location";
import { Barometer, Pedometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TASK, MAX_ACCURACY_METERS } from "../constants";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { SensorStore, sharedSensorStore } from "../store/sensorStore";
import { anchoredBaroAlt } from "../utils/anchoredBaroAlt";
import { geoFilter } from "../utils/geoFilter";
import { haversineMeters } from "../utils/haversineMeters";

const joiner = new StreamJoiner(sharedSensorStore, 3000);

let lastAcceptedTs = 0;
let lastAcceptedLat = 0;
let lastAcceptedLng = 0;
let lastAcceptedSteps: number | null = null;

function isFirstSample(sharedSensorStore: SensorStore) {
    return sharedSensorStore.locations.last() === undefined;
}

function reset() {
    lastAcceptedTs = 0;
    lastAcceptedLat = 0;
    lastAcceptedLng = 0;
    lastAcceptedSteps = null;
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

        if (accuracy != null && accuracy > MAX_ACCURACY_METERS) {
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

        const isBaroAvailable = await Barometer.isAvailableAsync();
        const isPedometerAvailable = await Pedometer.isAvailableAsync();

        if (isBaroAvailable && joined.pressure == null) continue;
        if (isPedometerAvailable && joined.steps == null) continue;

        const fusedAltitude = anchoredBaroAlt.update(
            joined.timestamp,
            joined.pressure?.pressure ?? null,
            joined.location.altitude ?? null,
            joined.location.altitudeAccuracy ?? null
        );

        const totalSteps = joined.steps?.totalSteps ?? null;
        if (
            totalSteps &&
            lastAcceptedSteps != null &&
            totalSteps < lastAcceptedSteps
        ) {
            lastAcceptedSteps = null;
        }

        const deltaSteps = (totalSteps ?? 0) - (lastAcceptedSteps ?? 0);

        joinedState.push({
            timestamp: joined.timestamp,
            latitude: filtered.latitude,
            longitude: filtered.longitude,
            altitude: fusedAltitude ?? joined.location.altitude ?? null,
            pressure: joined.pressure?.pressure ?? null,
            steps: deltaSteps,
            distance: deltaDistance,
            isRunning: null,
            raw: {
                timestamp: joined.timestamp,
                latitude,
                longitude,
                accuracy,
                altitude,
                altitudeAccuracy: joined.location.altitudeAccuracy,
                speed: joined.location.speed,
                pressure: joined.pressure?.pressure ?? null,
            },
        });

        lastAcceptedTs = joined.timestamp;
        lastAcceptedLat = filtered.latitude;
        lastAcceptedLng = filtered.longitude;
        lastAcceptedSteps = joined.steps?.totalSteps ?? null;
    }
});
