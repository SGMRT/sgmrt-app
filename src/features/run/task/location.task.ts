import { devLog } from "@/src/utils/devLog";
import type { LocationObject } from "expo-location";
import { Barometer } from "expo-sensors";
import { getStepCountAsync } from "expo-sensors/build/Pedometer";
import * as TaskManager from "expo-task-manager";
import {
    LOCATION_TASK,
    MAX_ACCURACY_METERS,
    MIN_DISPLACEMENT_METERS,
} from "../constants";
import { joinedState } from "../store/joinedState";
import { StreamJoiner } from "../store/joiner";
import { SensorStore, sharedSensorStore } from "../store/sensorStore";
import { StepSample } from "../store/sensorTypes";
import { geoFilter } from "../utils/geoFilter";
import { haversineMeters } from "../utils/haversineMeters";
import { outlierDetector } from "../utils/outlierDetector";
import { pressureAltitudeM } from "../utils/pressureAltitudeM";
import { stepDistanceValidator } from "../utils/stepDistanceValidator";

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
    geoFilter.reset();
    outlierDetector.reset();
    stepDistanceValidator.reset();
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

        // 1단계: 다단계 이상치 탐지
        const outlierResult = outlierDetector.check({
            latitude,
            longitude,
            timestamp: loc.timestamp,
            accuracy: accuracy ?? null,
            speed: loc.coords.speed ?? null,
            course: loc.coords.heading ?? null,
        });

        // 높은 신뢰도로 이상치로 판정되면 스킵
        if (outlierResult.isOutlier && outlierResult.confidence > 0.8) {
            devLog(
                `[LOCATION] 이상치 탐지: ${outlierResult.reason}, 신뢰도: ${outlierResult.confidence.toFixed(2)}`
            );
            continue;
        }

        // 기존 정확도 체크 (DEV 모드가 아닐 때만)
        if (accuracy != null && accuracy > MAX_ACCURACY_METERS && !__DEV__) {
            devLog("[LOCATION] 위치 불확실성 높음", accuracy);
            continue;
        }

        // 부분 신뢰 케이스: 정확도 조정
        const adjustedAccuracy = outlierResult.adjustedAccuracy ?? accuracy ?? 10;

        const filtered = geoFilter.process(
            latitude,
            longitude,
            adjustedAccuracy,
            loc.timestamp,
            loc.coords.speed ?? 0
        );

        // 2단계: 최소 변위 필터 + 정지 감지
        let deltaDistance = 0;

        if (lastAcceptedTs > 0) {
            // 필터링된 좌표가 아닌, 마지막 수용 좌표 기준으로 거리 계산
            const rawDelta = haversineMeters(
                lastAcceptedLat,
                lastAcceptedLng,
                filtered.latitude,
                filtered.longitude
            );

            // GPS 속도로 정지 상태 감지 (0.5 m/s 미만 = 거의 정지)
            const gpsSpeed = loc.coords.speed ?? 0;
            const isStationary = gpsSpeed < 0.5;

            // 정지 상태면 더 엄격한 임계값 적용 (5m)
            // 이동 중이면 기본 임계값 (2m)
            const threshold = isStationary ? 5.0 : MIN_DISPLACEMENT_METERS;

            // 최소 변위 이상일 때만 거리 누적 및 좌표/타임스탬프 업데이트
            if (rawDelta >= threshold) {
                deltaDistance = rawDelta;
                lastAcceptedLat = filtered.latitude;
                lastAcceptedLng = filtered.longitude;
                lastAcceptedTs = loc.timestamp; // Phase 4: 좌표와 함께 timestamp도 업데이트
            }
            // threshold 미만이면 좌표도 거리도 업데이트하지 않음
        } else {
            // 첫 샘플
            lastAcceptedLat = filtered.latitude;
            lastAcceptedLng = filtered.longitude;
            lastAcceptedTs = loc.timestamp;
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

        // Phase 1: stepDiff를 deltaDistance와 동기화된 구간으로 계산
        // 좌표가 업데이트될 때(deltaDistance > 0)만 stepDiff 계산 및 lastAcceptedSteps 업데이트
        let stepDiff = 0;
        if (deltaDistance > 0) {
            stepDiff =
                joined.steps?.totalSteps != null
                    ? joined.steps.totalSteps -
                      (lastAcceptedSteps?.totalSteps ?? 0)
                    : 0;

            // 3단계: 걸음수 기반 거리 보정
            // GPS 지그재그 노이즈로 인한 과측정을 걸음수 데이터로 보정
            if (stepDiff > 0) {
                const gpsSpeed = loc.coords.speed ?? 0;
                const validation = stepDistanceValidator.validate(
                    deltaDistance,
                    stepDiff,
                    gpsSpeed
                );

                if (validation.wasCorrected) {
                    devLog(
                        `[LOCATION] 거리 보정: GPS ${deltaDistance.toFixed(1)}m → ${validation.correctedDistance.toFixed(1)}m ` +
                            `(걸음수 기반 ${validation.stepBasedDistance.toFixed(1)}m, 비율 ${validation.gpsToStepRatio.toFixed(2)})`
                    );
                    deltaDistance = validation.correctedDistance;
                }
            }

            // 좌표 업데이트 시에만 lastAcceptedSteps도 함께 업데이트 (구간 동기화)
            if (joined.steps?.totalSteps != null) {
                lastAcceptedSteps = joined.steps;
            }
        }

        // 걸음수 폴백: 현재 joined에 steps가 없으면 마지막 값 사용
        if (joined.steps == null && lastAcceptedSteps != null) {
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
        // lastAcceptedTs는 이제 최소 변위 필터 통과 시에만 업데이트됨 (Phase 4)
    }
});
