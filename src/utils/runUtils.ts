import {
    AuthorizationStatus,
    authorizationStatusFor,
    isHealthDataAvailableAsync,
    ObjectTypeIdentifier,
    QuantitySampleForSaving,
    saveWorkoutSample,
    WorkoutActivityType,
} from "@kingstinct/react-native-healthkit";
import * as FileSystem from "expo-file-system";
import { postCourseRun, postRun } from "../apis";
import {
    BaseRunning,
    CourseGhostRunning,
    CourseSoloRunning,
    RunRecord,
    Telemetry,
} from "../apis/types/run";
import { encodeTelemetries } from "../apis/utils";
import { Segment } from "../components/map/RunningLine";
import { showCompactToast } from "../components/ui/toastConfig";
import { RawData, UserDashBoardData } from "../types/run";
import { Coordinate, getDistance } from "./mapUtils";

const canShare = (objectType: string) => {
    try {
        return (
            authorizationStatusFor(objectType as ObjectTypeIdentifier) ===
            AuthorizationStatus.sharingAuthorized
        );
    } catch {
        // 일부 타입이 버전/정의에 따라 던질 수 있으니 방어
        return false;
    }
};

const getRunTime = (runTime: number, format: "HH:MM:SS" | "MM:SS") => {
    let isNegative = false;
    if (runTime < 0) {
        isNegative = true;
        runTime = -runTime;
    }
    const hours = Math.floor(runTime / 3600);
    const minutes = Math.floor((runTime % 3600) / 60);
    const seconds = runTime % 60;

    if (hours > 0) {
        return `${isNegative ? "-" : ""}${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    } else {
        return `${isNegative ? "-" : ""}${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
};

function getPace(timeInSec: number, distanceInMeters: number): number {
    if (distanceInMeters <= 0 || timeInSec <= 0) return 0;
    const distanceInKm = distanceInMeters / 1000;

    const paceInSec = timeInSec / distanceInKm; // 초/km
    return Number(paceInSec.toFixed(2));
}

function getFormattedPace(paceInSec: number): string {
    const minutes = Math.floor(paceInSec / 60);
    const seconds = Math.floor(paceInSec % 60);
    return `${minutes}’${seconds.toString().padStart(2, "0")}”`;
}

function getCalories({
    distance,
    timeInSec,
    weight,
}: {
    distance: number;
    timeInSec: number;
    weight: number;
}): number {
    if (timeInSec === 0 || distance === 0 || weight === 0) return 0;

    const timeInHours = timeInSec / 3600;
    const distanceKm = distance / 1000;
    const speed = distanceKm / timeInHours;

    let met = 1;

    if (speed < 6.4) met = 4.5;
    else if (speed < 8) met = 7;
    else if (speed < 9.7) met = 9.0;
    else if (speed < 11.3) met = 11.0;
    else met = 13.5;

    return Math.round(met * weight * timeInHours);
}

function getCadence(stepCount: number, timeInSec: number): number {
    if (timeInSec === 0 || stepCount === 0) return 0;
    return Math.round((stepCount / timeInSec) * 60);
}

// 요일/시간/러닝
// 월요일 아침 러닝
function getRunName(date: number): string {
    const dateObj = new Date(date);

    const day = dateObj.toLocaleDateString("ko-KR", {
        weekday: "long",
    });

    const hour = dateObj.getHours();

    let timeLabel = "";
    if (hour < 6) timeLabel = "새벽";
    else if (hour < 12) timeLabel = "아침";
    else if (hour < 17) timeLabel = "오후";
    else if (hour < 21) timeLabel = "저녁";
    else timeLabel = "야간";

    return `${day} ${timeLabel} 러닝`;
}

function telemetriesToSegment(
    telemetries: Telemetry[],
    progress: number
): Segment[] {
    const run = telemetries.slice(
        0,
        progress >= telemetries.length ? telemetries.length : progress + 1
    );
    const rest = telemetries.slice(progress);

    return [
        {
            isRunning: true,
            points: run.map((telemetry) => ({
                longitude: telemetry.lng,
                latitude: telemetry.lat,
            })),
        },
        {
            isRunning: false,
            points: rest.map((telemetry) => ({
                longitude: telemetry.lng,
                latitude: telemetry.lat,
            })),
        },
    ];
}

export function getTelemetriesWithoutLastFalse(
    telemetries: Telemetry[]
): Telemetry[] {
    const lastTrueIndex = telemetries.findLastIndex(
        (telemetry) => telemetry.isRunning
    );

    return telemetries.slice(0, lastTrueIndex + 1);
}

interface SaveRunningProps {
    telemetries: Telemetry[];
    rawData: RawData[];
    userDashboardData: UserDashBoardData;
    thumbnailUri: string | null;
    runTime: number;
    isPublic: boolean;
    ghostRunningId?: number | null;
    courseId?: number;
}

export async function saveRunning({
    telemetries,
    rawData,
    userDashboardData,
    thumbnailUri,
    runTime,
    isPublic,
    ghostRunningId,
    courseId,
}: SaveRunningProps) {
    if (
        !userDashboardData ||
        userDashboardData.totalDistance === 0 ||
        userDashboardData.averagePace === 0 ||
        telemetries.filter((telemetry) => telemetry.isRunning).at(-1)?.pace ===
            0
    ) {
        showCompactToast("러닝 거리가 너무 짧습니다.");
        return;
    }

    const isHealthDataAvailable = await isHealthDataAvailableAsync();

    const stablePace =
        telemetries.length > 10
            ? telemetries.at(10)!.pace
            : telemetries.at(-1)?.pace ?? 0;

    telemetries.forEach((telemetry, index) => {
        if (index < 10) {
            telemetry.pace = stablePace;
        }
    });

    // 마지막 isRunning인 true인 값 뒤 isRunning이 false인 값을 모두 삭제
    const lastTrueIndex = telemetries.findLastIndex(
        (telemetry) => telemetry.isRunning
    );
    telemetries = telemetries.slice(0, lastTrueIndex + 1);

    const hasPaused = telemetries.some((telemetry) => !telemetry.isRunning);

    const startTime = telemetries.at(0)?.timeStamp;
    const endTime = telemetries.at(-1)?.timeStamp;

    const record: RunRecord = {
        distance: userDashboardData.totalDistance / 1000,
        elevationGain: userDashboardData.totalElevationGain,
        elevationLoss: userDashboardData.totalElevationLoss,
        duration: runTime,
        avgPace: userDashboardData.averagePace,
        calories: userDashboardData.totalCalories,
        avgBpm: userDashboardData.bpm === 0 ? 0 : userDashboardData.bpm,
        avgCadence: userDashboardData.averageCadence,
    };

    const rawTelemetryFileUri =
        FileSystem.cacheDirectory + "rawTelemetry.jsonl";
    const interpolatedTelemetryFileUri =
        FileSystem.cacheDirectory + "interpolatedTelemetry.jsonl";

    if (isHealthDataAvailable) {
        const canWriteWorkout = canShare("HKWorkoutTypeIdentifier");
        const canWriteDistance = canShare(
            "HKQuantityTypeIdentifierDistanceWalkingRunning"
        );
        const canwWriteEnergy = canShare(
            "HKQuantityTypeIdentifierActiveEnergyBurned"
        );
        const canWriteRoute = canShare("HKWorkoutRouteTypeIdentifier");

        console.log("canWriteWorkout", canWriteWorkout);
        console.log("canWriteDistance", canWriteDistance);
        console.log("canwWriteEnergy", canwWriteEnergy);
        console.log("canWriteRoute", canWriteRoute);

        if (!canWriteWorkout) {
            // no-op
        } else {
            const start = startTime ? new Date(startTime) : new Date();
            const end = endTime ? new Date(endTime) : new Date();

            const quantities: QuantitySampleForSaving[] = [];

            if (canWriteDistance) {
                quantities.push({
                    startDate: start,
                    endDate: end,
                    quantityType:
                        "HKQuantityTypeIdentifierDistanceWalkingRunning",
                    quantity: userDashboardData.totalDistance,
                    unit: "m",
                    metadata: {
                        HKExternalUUID: String(Date.now()),
                        source: "GhostRunner",
                    },
                });
            }

            if (canwWriteEnergy) {
                quantities.push({
                    startDate: start,
                    endDate: end,
                    quantityType: "HKQuantityTypeIdentifierActiveEnergyBurned",
                    quantity: userDashboardData.totalCalories,
                    unit: "kcal",
                    metadata: {
                        HKExternalUUID: String(Date.now()),
                        source: "GhostRunner",
                    },
                });
            }

            if (quantities.length > 0) {
                const workout = await saveWorkoutSample(
                    WorkoutActivityType.running,
                    quantities,
                    start,
                    end,
                    {
                        distance: userDashboardData.totalDistance,
                        energyBurned: userDashboardData.totalCalories,
                    },
                    {
                        HKExternalUUID: String(Date.now()),
                        source: "GhostRunner",
                    }
                );

                if (canWriteRoute) {
                    await workout.saveWorkoutRoute(
                        rawData.map((item) => ({
                            altitude: item.altitude,
                            date: new Date(item.timestamp),
                            horizontalAccuracy: item.accuracy,
                            latitude: item.latitude,
                            longitude: item.longitude,
                            speed: item.speed,
                            verticalAccuracy: item.altitudeAccuracy,
                            course: item.course,
                        }))
                    );
                }
            }
        }
    }

    try {
        const rawJsonl = rawData.map((item) => JSON.stringify(item)).join("\n");
        const interpolatedJsonl = encodeTelemetries(telemetries)
            .map((item) => JSON.stringify(item))
            .join("\n");

        await FileSystem.writeAsStringAsync(rawTelemetryFileUri, rawJsonl);
        await FileSystem.writeAsStringAsync(
            interpolatedTelemetryFileUri,
            interpolatedJsonl
        );

        const formData = new FormData();

        formData.append("rawTelemetry", {
            uri: rawTelemetryFileUri,
            name: "rawTelemetry.jsonl",
            type: "application/json",
        } as any);
        formData.append("interpolatedTelemetry", {
            uri: interpolatedTelemetryFileUri,
            name: "interpolatedTelemetry.jsonl",
            type: "application/json",
        } as any);
        if (thumbnailUri) {
            formData.append("screenShotImage", {
                uri: thumbnailUri,
                name: "screenShotImage.jpg",
                type: "image/jpeg",
            } as any);
        }

        if (ghostRunningId) {
            const request: CourseGhostRunning = {
                runningName: getRunName(startTime ?? 0),
                startedAt: startTime ?? 0,
                hasPaused,
                isPublic: hasPaused ? false : isPublic,
                mode: "GHOST",
                ghostRunningId,
                record,
            };

            const reqFileUri = FileSystem.cacheDirectory + "req.json";
            await FileSystem.writeAsStringAsync(
                reqFileUri,
                JSON.stringify(request)
            );
            formData.append("req", {
                uri: reqFileUri,
                name: "req.json",
                type: "application/json",
            } as any);

            const response = await postCourseRun(formData, courseId!);
            return {
                runningId: response,
                courseId: courseId,
            };
        } else if (courseId) {
            const request: CourseSoloRunning = {
                runningName: getRunName(startTime ?? 0),
                startedAt: startTime ?? 0,
                hasPaused,
                isPublic: hasPaused ? false : isPublic,
                mode: "SOLO",
                ghostRunningId: null,
                record,
            };

            const reqFileUri = FileSystem.cacheDirectory + "req.json";
            await FileSystem.writeAsStringAsync(
                reqFileUri,
                JSON.stringify(request)
            );
            formData.append("req", {
                uri: reqFileUri,
                name: "req.json",
                type: "application/json",
            } as any);

            const response = await postCourseRun(formData, courseId);
            return {
                runningId: response,
                courseId: courseId,
            };
        } else {
            const request: BaseRunning = {
                runningName: getRunName(startTime ?? 0),
                startedAt: startTime ?? 0,
                hasPaused,
                isPublic: hasPaused ? false : isPublic,
                record,
            };

            const reqFileUri = FileSystem.cacheDirectory + "req.json";
            await FileSystem.writeAsStringAsync(
                reqFileUri,
                JSON.stringify(request)
            );
            formData.append("req", {
                uri: reqFileUri,
                name: "req.json",
                type: "application/json",
            } as any);

            const response = await postRun(formData);
            return response;
        }
    } catch (error) {
        console.error(error);
    }
}

function getDate(date: number): string {
    return new Date(date)
        .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        .slice(0, 12)
        .split(". ")
        .join(".");
}

function checkPointSynced(
    targetPosition: Coordinate,
    currentPosition: Coordinate,
    acceptanceDistance: number
) {
    const distance = getDistance(targetPosition, currentPosition);
    return distance < acceptanceDistance;
}

function findClosestPointIndex(
    currentPosition: Coordinate,
    telemetries: Telemetry[],
    acceptanceDistance: number
) {
    return telemetries.findIndex((telemetry) =>
        checkPointSynced(
            { lat: telemetry.lat, lng: telemetry.lng },
            currentPosition,
            acceptanceDistance
        )
    );
}

export {
    checkPointSynced,
    findClosestPointIndex,
    getCadence,
    getCalories,
    getDate,
    getFormattedPace,
    getPace,
    getRunName,
    getRunTime,
    telemetriesToSegment,
};
