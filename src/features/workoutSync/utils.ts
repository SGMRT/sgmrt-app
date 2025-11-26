import { Telemetry } from "@/src/apis/types/run";
import { RawData } from "@/src/types/run";
import { getFormattedPace } from "@/src/utils/runUtils";
import { WorkoutRoute } from "@kingstinct/react-native-healthkit";

export function paceFromKmh(speed: number): number {
    if (!speed || speed <= 0) return 0;
    return 3600 / speed;
}

export function workoutRouteRawData(route: WorkoutRoute): RawData[] {
    return route.locations.map((r) => ({
        timestamp: r.date.getTime(),
        latitude: r.latitude,
        longitude: r.longitude,
        altitude: r.altitude ?? 0,
        speed: r.speed ?? 0,
        accuracy: r.horizontalAccuracy ?? 0,
        altitudeAccuracy: r.verticalAccuracy ?? 0,
        pressure: 0,
        course: r.course ?? 0,
    }));
}

/** 고도 누적, 텔레메트리 계산 */
export function workoutRouteTelemetry(
    route: WorkoutRoute,
    averageHeartRate: number,
    averageCadence: number
): {
    telemetries: Telemetry[];
    totalElevationGain: number;
    totalElevationLoss: number;
} {
    let totalDistance = 0;

    const { smoothedAltitudes, totalGain, totalLoss } =
        computeElevationFromRoute(route, 0.5, 0.8);

    const telemetries = route.locations.map((r, idx) => {
        const segmentDistKm = r.distance ?? 0;
        const segmentDistM = segmentDistKm * 1000;
        totalDistance += segmentDistM;

        const altitude = smoothedAltitudes[idx];

        console.log(
            getFormattedPace(paceFromKmh((r.speed ?? 0) * 3.6)),
            r.speed
        );
        return {
            timeStamp: r.date.getTime(),
            lat: r.latitude,
            lng: r.longitude,
            dist: totalDistance,
            pace: paceFromKmh(r.speed ?? 0),
            alt: altitude,
            cadence: averageCadence,
            bpm: averageHeartRate,
            isRunning: true,
        };
    });

    return {
        telemetries,
        totalElevationGain: totalGain,
        totalElevationLoss: totalLoss,
    };
}

export const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

export const round = (value: number, digits = 0) =>
    Number(value.toFixed(digits));

export const formatDistanceKm = (meters: number) => meters / 1000;

export function getAltitudesFromRoute(route: WorkoutRoute): number[] {
    return route.locations.map((r) => r.altitude ?? 0);
}

// 1. EMA로 고도 스무딩
export function smoothElevationEMA(
    elevations: number[],
    alpha = 0.25
): number[] {
    if (!elevations.length) return [];

    const smoothed: number[] = [];
    let ema = elevations[0];
    smoothed.push(ema);

    for (let i = 1; i < elevations.length; i++) {
        ema = alpha * elevations[i] + (1 - alpha) * ema;
        smoothed.push(ema);
    }

    return smoothed;
}

export function computeElevationFromRoute(
    route: WorkoutRoute,
    alpha = 0.25,
    deadzoneMeters = 1
) {
    const rawAlts = getAltitudesFromRoute(route);
    const smoothed = smoothElevationEMA(rawAlts, alpha);

    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < smoothed.length; i++) {
        const diff = smoothed[i] - smoothed[i - 1];

        if (diff > deadzoneMeters) {
            totalGain += diff;
        } else if (diff < -deadzoneMeters) {
            totalLoss += diff;
        }
    }

    return { smoothedAltitudes: smoothed, totalGain, totalLoss };
}
