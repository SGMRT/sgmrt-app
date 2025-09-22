import { devLog } from "@/src/utils/devLog";
import type { LocationObject } from "expo-location";
import { Barometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TASK, MAX_ACCURACY_METERS } from "../constants";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { SensorStore, sharedSensorStore } from "../store/sensorStore";
import { geoFilter } from "../utils/geoFilter";
import { haversineMeters } from "../utils/haversineMeters";
import { pressureAltitudeM } from "../utils/pressureAltitudeM";

const joiner = new StreamJoiner(sharedSensorStore, 3000);

let lastAcceptedTs = 0;
let lastAcceptedLat = 0;
let lastAcceptedLng = 0;
let lastAcceptedSteps: number | null = null;

// 다음 샘플에서 deltaSteps를 0으로 초기화할지 여부
let zeroNextStepsDelta = false;

// 합리적인 SPM 범위
const MIN_STEPS_PER_SEC = 1.0;
const MAX_STEPS_PER_SEC = 4.5;

function isFirstSample(sharedSensorStore: SensorStore) {
    return sharedSensorStore.locations.last() === undefined;
}

function reset() {
    lastAcceptedTs = 0;
    lastAcceptedLat = 0;
    lastAcceptedLng = 0;
    lastAcceptedSteps = null;
    zeroNextStepsDelta = false;
}

export function markResumeAnchor() {
    zeroNextStepsDelta = true;
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
        if (isBaroAvailable && joined.pressure == null) {
            devLog("[LOCATION] 압력 데이터 없음");
            continue;
        }

        const pressureAltitude = pressureAltitudeM(
            joined.pressure?.pressure ?? 0
        );

        const totalSteps = joined.steps?.totalSteps ?? lastAcceptedSteps ?? 0;
        const dtSec =
            lastAcceptedTs > 0
                ? Math.max(0, (joined.timestamp - lastAcceptedTs) / 1000)
                : 0;
        let deltaSteps = 0;

        if (lastAcceptedTs === 0) {
            deltaSteps = 0;
            lastAcceptedSteps = totalSteps;
        } else if (zeroNextStepsDelta) {
            deltaSteps = 0;
            lastAcceptedSteps = totalSteps;
            zeroNextStepsDelta = false;
        } else {
            const rawDelta = Math.max(0, totalSteps - (lastAcceptedSteps ?? 0));

            if (dtSec > 0) {
                const maxAllowed = Math.ceil(MAX_STEPS_PER_SEC * dtSec * 1.2);
                const minAllowed = dtSec >= 0.2 ? 0 : 0;

                if (rawDelta > maxAllowed) {
                    devLog("[STEPS] 비정상 jump 컷", {
                        rawDelta,
                        dtSec,
                        maxAllowed,
                    });
                    deltaSteps = 0;
                    lastAcceptedSteps = totalSteps;
                } else {
                    deltaSteps = Math.max(minAllowed, rawDelta);
                    lastAcceptedSteps = (lastAcceptedSteps ?? 0) + deltaSteps;
                }
            } else {
                deltaSteps = 0;
                lastAcceptedSteps = totalSteps;
            }
        }

        joinedState.push({
            timestamp: joined.timestamp,
            latitude: filtered.latitude,
            longitude: filtered.longitude,
            altitude: pressureAltitude ?? joined.location.altitude ?? null,
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
                course: joined.location.course,
                pressure: joined.pressure?.pressure ?? null,
            },
        });

        lastAcceptedTs = joined.timestamp;
        lastAcceptedLat = filtered.latitude;
        lastAcceptedLng = filtered.longitude;
        lastAcceptedSteps = totalSteps;
    }
});
