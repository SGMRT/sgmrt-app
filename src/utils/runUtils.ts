import {
    AuthorizationStatus,
    authorizationStatusFor,
    isHealthDataAvailableAsync,
    ObjectTypeIdentifier,
    QuantitySampleForSaving,
    saveWorkoutSample,
    WorkoutActivityType,
} from "@kingstinct/react-native-healthkit";
import * as Sentry from "@sentry/react-native";
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
import { applyAltitudeBiasFromBestGPS } from "../features/run/utils/applyAltitudeBias";
import { RawData, UserDashBoardData } from "../types/run";
import { Coordinate, getDistance } from "./mapUtils";
import { addPhase, addWarn, captureError, trackDuration } from "./sentryTools";

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

const getRunTime = (
    runTime: number,
    format:
        | "HH:MM:SS"
        | "MM:SS"
        | "HH:MM:SS_IF_HH_EXISTS" = "HH:MM:SS_IF_HH_EXISTS"
) => {
    let isNegative = false;
    if (runTime < 0) {
        isNegative = true;
        runTime = -runTime;
    }

    const hours = Math.floor(runTime / 3600);
    const minutes = Math.floor((runTime % 3600) / 60);
    const seconds = Math.floor(runTime % 60);

    const prefix = isNegative ? "-" : "";

    if (
        format === "HH:MM:SS" ||
        (format === "HH:MM:SS_IF_HH_EXISTS" && hours > 0)
    ) {
        return `${prefix}${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    const totalMinutes = hours * 60 + minutes;
    return `${prefix}${totalMinutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
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
    addPhase("precheck", {
        totalTelemetry: telemetries?.length ?? 0,
        rawDataLen: rawData?.length ?? 0,
        hasUserDashboardData: !!userDashboardData,
    });
    try {
        if (!userDashboardData || userDashboardData.totalDistance < 100) {
            addWarn("short-distance-block", {
                totalDistance: userDashboardData?.totalDistance,
            });
            showCompactToast("러닝 거리가 너무 짧습니다.");
            return;
        }

        const tAlt = trackDuration("applyAltitudeBiasFromBestGPS");
        try {
            telemetries = applyAltitudeBiasFromBestGPS(telemetries, rawData);
        } catch (e) {
            captureError("applyAltitudeBiasFromBestGPS", e, {
                telemetriesLen: telemetries?.length ?? 0,
                rawDataLen: rawData?.length ?? 0,
            });
        } finally {
            tAlt.end();
        }

        addPhase("stabilize-pace:begin");
        const isHealthDataAvailable = await isHealthDataAvailableAsync();
        const stablePace =
            telemetries.length > 10
                ? telemetries.at(10)!.pace
                : telemetries.at(-1)?.pace ?? 0;

        for (let i = 0; i < Math.min(10, telemetries.length); i++) {
            telemetries[i].pace = stablePace;
        }
        addPhase("stabilize-pace:end", { stablePace });

        // 마지막 isRunning인 true인 값 뒤 isRunning이 false인 값을 모두 삭제
        const lastTrueIndex = telemetries.findLastIndex((t) => t.isRunning);
        if (lastTrueIndex === -1) {
            const err = new Error("NoRunningSegment");
            captureError("trim-telemetry", err, {
                telemetriesLen: telemetries.length,
            });
            throw err;
        }
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

        const tHK = trackDuration("healthkit-save");
        try {
            if (isHealthDataAvailable) {
                const canWriteWorkout = canShare("HKWorkoutTypeIdentifier");
                const canWriteDistance = canShare(
                    "HKQuantityTypeIdentifierDistanceWalkingRunning"
                );
                const canWriteEnergy = canShare(
                    "HKQuantityTypeIdentifierActiveEnergyBurned"
                );
                const canWriteRoute = canShare("HKWorkoutRouteTypeIdentifier");

                Sentry.setContext("healthkitCaps", {
                    isHealthDataAvailable,
                    canWriteWorkout,
                    canWriteDistance,
                    canWriteEnergy,
                    canWriteRoute,
                });

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
                    if (canWriteEnergy) {
                        quantities.push({
                            startDate: start,
                            endDate: end,
                            quantityType:
                                "HKQuantityTypeIdentifierActiveEnergyBurned",
                            quantity: userDashboardData.totalCalories,
                            unit: "kcal",
                            metadata: {
                                HKExternalUUID: String(Date.now()),
                                source: "GhostRunner",
                            },
                        });
                    }

                    if (quantities.length > 0) {
                        let workout: Awaited<
                            ReturnType<typeof saveWorkoutSample>
                        > | null = null;
                        try {
                            workout = await saveWorkoutSample(
                                WorkoutActivityType.running,
                                quantities,
                                start,
                                end,
                                {
                                    distance: userDashboardData.totalDistance,
                                    energyBurned:
                                        userDashboardData.totalCalories,
                                },
                                {
                                    HKExternalUUID: String(Date.now()),
                                    source: "GhostRunner",
                                }
                            );
                        } catch (e) {
                            captureError("healthkit:saveWorkoutSample", e, {
                                start: start.toISOString(),
                                end: end.toISOString(),
                                quantities,
                            });
                        }

                        if (workout && canWriteRoute) {
                            try {
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
                            } catch (e) {
                                captureError("healthkit:saveWorkoutRoute", e, {
                                    routePoints: rawData.length,
                                });
                            }
                        }
                    }
                }
            }
        } finally {
            tHK.end({ isHealthDataAvailable });
        }

        const rawTelemetryFileUri =
            FileSystem.cacheDirectory + "rawTelemetry.jsonl";
        const interpolatedTelemetryFileUri =
            FileSystem.cacheDirectory + "interpolatedTelemetry.jsonl";

        const tFS = trackDuration("filesystem:write-jsonl");
        try {
            const rawJsonl = rawData
                .map((item) => JSON.stringify(item))
                .join("\n");
            const interpolatedJsonl = encodeTelemetries(telemetries)
                .map((item) => JSON.stringify(item))
                .join("\n");

            await FileSystem.writeAsStringAsync(rawTelemetryFileUri, rawJsonl);
            await FileSystem.writeAsStringAsync(
                interpolatedTelemetryFileUri,
                interpolatedJsonl
            );

            const [rawInfo, intInfo] = await Promise.all([
                FileSystem.getInfoAsync(rawTelemetryFileUri),
                FileSystem.getInfoAsync(interpolatedTelemetryFileUri),
            ]);
            Sentry.setContext("telemetryFiles", {
                rawTelemetryFileUri,
                interpolatedTelemetryFileUri,
                rawFileInfo: rawInfo?.exists ? rawInfo.size : 0,
                interpolatedFileInfo: intInfo?.exists ? intInfo.size : 0,
                telemetriesLen: telemetries.length,
                rawDataLen: rawData.length,
            });
        } catch (e) {
            captureError("filesystem:write-jsonl", e, {
                rawTelemetryFileUri,
                interpolatedTelemetryFileUri,
                telemetriesLen: telemetries.length,
                rawDataLen: rawData.length,
            });
            throw e;
        } finally {
            tFS.end();
        }

        const tUpload = trackDuration("upload:post-run");
        try {
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

            const reqFileUri = FileSystem.cacheDirectory + "req.json";

            const baseReq = {
                runningName: getRunName(startTime ?? 0),
                startedAt: startTime ?? 0,
                hasPaused,
                isPublic: hasPaused ? false : isPublic,
                record,
            };

            Sentry.setContext("runMeta", {
                courseId: courseId ?? null,
                ghostRunningId: ghostRunningId ?? null,
                hasPaused,
                isPublic: hasPaused ? false : isPublic,
                startTime,
                endTime,
                duration: runTime,
                distanceM: userDashboardData.totalDistance,
                calories: userDashboardData.totalCalories,
                avgPace: userDashboardData.averagePace,
            });

            if (ghostRunningId && courseId) {
                const request: CourseGhostRunning = {
                    ...baseReq,
                    mode: "GHOST",
                    ghostRunningId,
                };
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
                addPhase("upload:postCourseRun:success", {
                    response,
                    courseId,
                });
                return { runningId: response, courseId };
            } else if (courseId) {
                const request: CourseSoloRunning = {
                    ...baseReq,
                    mode: "SOLO",
                    ghostRunningId: null,
                };
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
                addPhase("upload:postCourseRun:success", {
                    response,
                    courseId,
                });
                return { runningId: response, courseId };
            } else {
                const request: BaseRunning = { ...baseReq };
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
                addPhase("upload:postRun:success", { response });
                return response;
            }
        } catch (e) {
            captureError("upload", e, {
                courseId,
                ghostRunningId,
                thumbnail: !!thumbnailUri,
            });
            throw e;
        } finally {
            tUpload.end();
        }
    } catch (error) {
        // 이 함수의 최상위 실패 포인트
        captureError("saveRunning:top-level", error);
        throw error;
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
    telemetriesToSegment
};
