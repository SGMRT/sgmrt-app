// features/run/background/location.task.ts
import { devLog } from "@/src/utils/devLog";
import type { LocationObject } from "expo-location";
import { Barometer, Pedometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import {
    LOCATION_TASK,
    MAX_ACCURACY_METERS,
    MIN_DISPLACEMENT_METERS,
} from "../constants";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { sharedSensorStore } from "../store/singletonStore";
import { haversineMeters } from "../utils/haversineMeters";

const joiner = new StreamJoiner(sharedSensorStore, 3000);

let lastAcceptedTs = 0;
let lastAcceptedLat = 0;
let lastAcceptedLng = 0;
let lastAcceptedSteps: number | null = null;

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const { locations } = (data ?? {}) as { locations?: LocationObject[] };
    if (!locations?.length) return;

    locations.sort((a, b) => a.timestamp - b.timestamp);

    for (const loc of locations) {
        const { latitude, longitude, accuracy } = loc.coords;

        if (accuracy != null && accuracy > MAX_ACCURACY_METERS) {
            devLog("[LOCATION] 위치 불확실성 높음", accuracy);
            continue;
        }

        let deltaDistance = 0;

        if (lastAcceptedTs > 0) {
            deltaDistance = haversineMeters(
                lastAcceptedLat,
                lastAcceptedLng,
                latitude,
                longitude
            );
            if (deltaDistance < MIN_DISPLACEMENT_METERS) {
                devLog("[LOCATION] 위치 거리 차이 너무 작음", deltaDistance);
                continue;
            }
        }

        const sample = sharedSensorStore.pushLocation(loc);
        const joined = joiner.onNewLocation(sample);

        const isBaroAvailable = await Barometer.isAvailableAsync();
        const isPedometerAvailable = await Pedometer.isAvailableAsync();

        if (isBaroAvailable && joined.pressure == null) continue;
        if (isPedometerAvailable && joined.steps == null) continue;

        const totalSteps = joined.steps?.totalSteps ?? null;
        const deltaSteps = totalSteps
            ? totalSteps - (lastAcceptedSteps ?? 0)
            : null;

        joinedState.push({
            timestamp: joined.timestamp,
            latitude: joined.location.latitude,
            longitude: joined.location.longitude,
            accuracy: joined.location.accuracy,
            altitude: joined.location.altitude,
            altitudeAccuracy: joined.location.altitudeAccuracy,
            speed: joined.location.speed,
            pressure: joined.pressure?.pressure ?? null,
            steps: deltaSteps,
            distance: deltaDistance,
        });

        lastAcceptedTs = joined.timestamp;
        lastAcceptedLat = joined.location.latitude;
        lastAcceptedLng = joined.location.longitude;
        lastAcceptedSteps = joined.steps?.totalSteps ?? null;
    }
});
