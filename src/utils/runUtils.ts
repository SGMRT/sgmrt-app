import LiveActivities from "@/modules/expo-live-activity";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { postCourseRun, postRun } from "../apis";
import {
    BaseRunning,
    CourseGhostRunning,
    CourseSoloRunning,
    RunRecord,
    Telemetry,
} from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";
import { LOCATION_TASK, UserDashBoardData } from "../types/run";
import { Coordinate, getDistance } from "./mapUtils";

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
    if (paceInSec === 0) return "-'-''";
    if (paceInSec > 1800) return "-'-''";
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

function getTelemetriesWithoutLastFalse(telemetries: Telemetry[]): Telemetry[] {
    const lastTrueIndex = telemetries.findLastIndex(
        (telemetry) => telemetry.isRunning
    );

    return telemetries.slice(0, lastTrueIndex + 1);
}

interface SaveRunningProps {
    telemetries: Telemetry[];
    userDashboardData: UserDashBoardData;
    runTime: number;
    isPublic: boolean;
    ghostRunningId?: number | null;
    courseId?: number;
}

export async function saveRunning({
    telemetries,
    userDashboardData,
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
        Toast.show({
            type: "info",
            text1: "러닝 거리가 너무 짧습니다.",
            position: "bottom",
            bottomOffset: 60,
        });
        return;
    }

    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
    if (LiveActivities.isActivityInProgress()) {
        LiveActivities.endActivity();
    }

    const truncatedTelemetries = getTelemetriesWithoutLastFalse(telemetries);

    const stablePace =
        truncatedTelemetries.length > 30
            ? truncatedTelemetries.at(29)!.pace
            : truncatedTelemetries.at(-1)?.pace ?? 0;

    truncatedTelemetries.forEach((telemetry, index) => {
        if (index < 30) {
            telemetry.pace = stablePace;
        }
    });

    const hasPaused = truncatedTelemetries.some(
        (telemetry) => !telemetry.isRunning
    );

    const startTime = truncatedTelemetries.at(0)?.timeStamp;

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

    if (ghostRunningId) {
        const request: CourseGhostRunning = {
            runningName: getRunName(startTime ?? 0),
            startedAt: startTime ?? 0,
            hasPaused,
            isPublic: hasPaused ? false : isPublic,
            telemetries: truncatedTelemetries,
            mode: "GHOST",
            ghostRunningId,
            record,
        };
        const response = await postCourseRun(request, courseId!);
        return response;
    } else if (courseId) {
        const request: CourseSoloRunning = {
            runningName: getRunName(startTime ?? 0),
            startedAt: startTime ?? 0,
            hasPaused,
            isPublic: hasPaused ? false : isPublic,
            telemetries: truncatedTelemetries,
            mode: "SOLO",
            ghostRunningId: null,
            record,
        };
        const response = await postCourseRun(request, courseId);
        return response;
    } else {
        const request: BaseRunning = {
            runningName: getRunName(startTime ?? 0),
            startedAt: startTime ?? 0,
            hasPaused,
            isPublic: hasPaused ? false : isPublic,
            telemetries: truncatedTelemetries,
            record,
        };
        const response = await postRun(request);
        return response;
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
