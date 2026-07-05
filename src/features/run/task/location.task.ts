import { devLog } from "@/src/utils/devLog";
import { captureError, ERROR_PRIORITY } from "@/src/utils/sentryTools";
import type { LocationObject } from "expo-location";
import { Barometer } from "expo-sensors";
import { getStepCountAsync } from "expo-sensors/build/Pedometer";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TASK, MAX_ACCURACY_METERS } from "../constants";
import { distanceAccumulator } from "../distance/DistanceAccumulator";
import {
    GPS_PIPELINE_VERSION,
    movementClassifier,
    outlierDetector,
} from "../filters";
import type { MovementState, OutlierResult } from "../filters/types";
import { paceCalculator } from "../pace/PaceCalculator";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { SensorStore, sharedSensorStore } from "../store/sensorStore";
import { StepSample } from "../store/sensorTypes";
import { haversineMeters } from "../utils/haversineMeters";
import { pressureAltitudeM } from "../utils/pressureAltitudeM";

const joiner = new StreamJoiner(sharedSensorStore, 3000);

// 스트림 중단 시 마지막 값 유지 한도 — 초과 시 스테일로 간주하고 null 보고
// (끊긴 워치의 심박이 러닝 끝까지 살아있는 값처럼 기록되는 것 방지)
const HEART_RATE_STALE_MS = 15_000;
const PRESSURE_STALE_MS = 60_000;

let lastAcceptedTs = 0;
let lastAcceptedLat = 0;
let lastAcceptedLng = 0;

let lastAcceptedPressure: { pressure: number; timestamp: number } | null =
    null;
let lastAcceptedSteps: StepSample | null = null;
let lastAcceptedHeartRate: { bpm: number; timestamp: number } | null = null;

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

    // v2 파이프라인 필터 초기화
    if (GPS_PIPELINE_VERSION === "v2") {
        outlierDetector.reset();
        movementClassifier.reset();
        distanceAccumulator.reset();
        paceCalculator.reset();
    }
}

async function handleLocationBatch({
    data,
    error,
}: {
    data: unknown;
    error: unknown;
}) {
    if (error) {
        captureError(
            "location.task.error",
            error,
            { taskName: LOCATION_TASK },
            { "location.taskError": "true" },
            ERROR_PRIORITY.HIGH
        );
        return;
    }
    const { locations } = (data ?? {}) as { locations?: LocationObject[] };
    if (!locations?.length) return;

    locations.sort((a, b) => a.timestamp - b.timestamp);

    if (isFirstSample(sharedSensorStore)) {
        devLog("[LOCATION] 첫 샘플");
        reset();
    }

    for (const loc of locations) {
        const { latitude, longitude, accuracy, altitude } = loc.coords;

        // iOS는 속도가 무효일 때 -1을 보고하므로 음수는 null 처리
        const sanitizedSpeed =
            loc.coords.speed != null && loc.coords.speed >= 0
                ? loc.coords.speed
                : null;

        // v2: OutlierDetector 사용
        // legacy: 기존 accuracy 필터만 사용
        let outlierResult: OutlierResult | null = null;

        if (GPS_PIPELINE_VERSION === "v2") {
            outlierResult = outlierDetector.detect({
                latitude,
                longitude,
                accuracy: accuracy ?? null,
                timestamp: loc.timestamp,
                speed: sanitizedSpeed,
                course: loc.coords.heading ?? null,
            });

            if (outlierResult.isOutlier) {
                devLog(
                    `[LOCATION:v2] 이상치 제거: ${outlierResult.reason}`,
                    accuracy
                );
                continue;
            }

            // 연속 거부 후 재앵커: 이전 위치와의 점프 거리를 누적하지 않도록
            // 거리/분류 상태도 새 위치 기준으로 재설정
            if (outlierResult.reanchored) {
                devLog("[LOCATION:v2] 재앵커", { latitude, longitude });
                movementClassifier.reset();
                distanceAccumulator.reanchor(
                    { latitude, longitude },
                    loc.timestamp
                );
            }
        } else {
            // legacy: 기존 정확도 필터
            if (accuracy != null && accuracy > MAX_ACCURACY_METERS && !__DEV__) {
                devLog("[LOCATION] 위치 불확실성 높음", accuracy);
                continue;
            }
        }

        // iOS BestForNavigation이 이미 칼만 필터를 적용하므로 직접 사용
        const filtered = { latitude, longitude };

        // 거리 계산
        let deltaDistance = 0;
        let movementState: MovementState | undefined;
        let confidence: number | undefined;

        const sample = sharedSensorStore.pushLocation(loc);
        const joined = joiner.onNewLocation(sample);

        // 스텝 정보 미리 계산 (MovementClassifier에서 사용)
        const stepDiff =
            joined.steps?.totalSteps != null
                ? joined.steps.totalSteps - (lastAcceptedSteps?.totalSteps ?? 0)
                : 0;

        if (GPS_PIPELINE_VERSION === "v2") {
            // v2: 새로운 파이프라인
            // 1. 위에서 계산한 outlierResult에서 신뢰도 가져오기 (detect 재호출 안함!)
            confidence = outlierResult?.confidence ?? 0.5;

            // 2. 이동 상태 분류
            const estimatedSpeed =
                sanitizedSpeed ?? outlierDetector.getAverageSpeed();
            movementState = movementClassifier.classify(
                estimatedSpeed,
                { latitude: filtered.latitude, longitude: filtered.longitude },
                stepDiff > 0 ? stepDiff : null
            );

            // 3. 정확도 가중 거리 누적
            const distanceResult = distanceAccumulator.accumulate(
                { latitude: filtered.latitude, longitude: filtered.longitude },
                confidence,
                movementState,
                loc.timestamp
            );

            deltaDistance = distanceResult.delta;

            if (__DEV__) {
                devLog("[LOCATION:v2]", {
                    movementState,
                    confidence: confidence.toFixed(2),
                    delta: deltaDistance.toFixed(2),
                    rawDelta: distanceResult.rawDelta.toFixed(2),
                    total: distanceResult.total.toFixed(2),
                });
            }
        } else {
            // legacy: 기존 방식
            if (lastAcceptedTs > 0) {
                deltaDistance = haversineMeters(
                    lastAcceptedLat,
                    lastAcceptedLng,
                    filtered.latitude,
                    filtered.longitude
                );
            }
        }

        if (joined.pressure?.pressure != null) {
            lastAcceptedPressure = {
                pressure: joined.pressure.pressure,
                timestamp: joined.pressure.timestamp,
            };
        } else if (
            lastAcceptedPressure != null &&
            joined.timestamp - lastAcceptedPressure.timestamp <=
                PRESSURE_STALE_MS
        ) {
            joined.pressure = {
                pressure: lastAcceptedPressure.pressure,
                timestamp: joined.timestamp,
            };
        }

        if (joined.steps?.totalSteps != null) {
            lastAcceptedSteps = joined.steps;
        } else if (lastAcceptedSteps != null) {
            joined.steps = lastAcceptedSteps;
        }

        if (joined.heartRate?.bpm != null) {
            lastAcceptedHeartRate = {
                bpm: joined.heartRate.bpm,
                timestamp: joined.heartRate.timestamp,
            };
        } else if (
            lastAcceptedHeartRate != null &&
            joined.timestamp - lastAcceptedHeartRate.timestamp <=
                HEART_RATE_STALE_MS
        ) {
            joined.heartRate = {
                bpm: lastAcceptedHeartRate.bpm,
                timestamp: joined.timestamp,
            };
        }

        // 압력 데이터 없어도 위치는 처리 (GPS 고도 사용)
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
            // v2 파이프라인 전용 필드
            movementState,
            confidence,
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
}

// TaskManager는 async 핸들러를 직렬화하지 않으므로 인보케이션을 체인으로
// 직렬화한다. 동시 실행되면 공유 필터/스토어 상태가 중간에 오염된다.
let taskChain: Promise<void> = Promise.resolve();

TaskManager.defineTask(LOCATION_TASK, (body) => {
    const run = taskChain.then(() => handleLocationBatch(body));
    // 실패해도 다음 인보케이션은 계속 처리
    taskChain = run.catch(() => {});
    return run;
});
