import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Segment } from "../components/map/RunningLine";
import { getDistance } from "../utils/mapUtils";
import { getCalories, getPace } from "../utils/runUtils";

interface Point {
    latitude: number;
    longitude: number;
    altitude: number;
}

interface SoloDashBoardData {
    distance: number;
    avgPace: number;
    avgCadence: string;
    gainElevation: number;
    calories: number;
    avgBpm: string;
}

export function useRunningSession() {
    const [isRunning, setIsRunning] = useState(false);
    const [soloDashboardData, setSoloDashboardData] =
        useState<SoloDashBoardData>({
            distance: 0,
            avgPace: 0,
            avgCadence: "--",
            gainElevation: 0,
            calories: 0,
            avgBpm: "--",
        });
    const [telemetries, setTelemetries] = useState<Telemetry[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [hasPaused, setHasPaused] = useState(false);

    // 타이머 Ref
    const timerRef = useRef<number | null>(null);

    // 구독하고 있는 Ref
    const locationRef = useRef<Point | null>(null);
    const pedometerRef = useRef(0);

    // 데이터 Ref
    const isRunningRef = useRef(false);
    const lastLocationRef = useRef<Point | null>(null);
    const timeRef = useRef(0);
    const firstStartTimestampRef = useRef<number | null>(null);
    const cumulativeDistanceRef = useRef(0);
    const cumulativeElevationRef = useRef(0);
    const lastElevationRef = useRef<number | null>(null);
    const stepCountRef = useRef(0);
    const lastPedometerRef = useRef(0);

    // 데이터 state
    const [runTime, setRunTime] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);

    // 달리기 시작
    const startRunning = () => {
        setIsRunning(true);
        isRunningRef.current = true;
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            const isRunning = isRunningRef.current;
            if (isRunning) {
                timeRef.current += 1;
                setRunTime(timeRef.current);
            }
            const location = locationRef.current;
            const lastLocation = lastLocationRef.current;
            if (!location) return;
            if (
                !lastLocation ||
                lastLocation.latitude !== location.latitude ||
                lastLocation.longitude !== location.longitude
            ) {
                if (!firstStartTimestampRef.current) {
                    firstStartTimestampRef.current = Date.now();
                    setStartTime(firstStartTimestampRef.current);
                    console.log("변화");
                }
                stepCountRef.current = isRunning
                    ? pedometerRef.current -
                      lastPedometerRef.current +
                      stepCountRef.current
                    : stepCountRef.current;
                lastPedometerRef.current = pedometerRef.current;
                const timeStamp = Date.now() - firstStartTimestampRef.current;
                const lat = location.latitude;
                const lng = location.longitude;
                const dist = isRunning
                    ? getDistance(lastLocation ?? location, location) +
                      cumulativeDistanceRef.current
                    : cumulativeDistanceRef.current;
                const pace = getPace(timeRef.current, dist);
                const calories = getCalories({
                    distance: dist,
                    timeInSec: timeRef.current,
                    weight: 70,
                });
                const alt = location.altitude;
                const elevation = alt - (lastElevationRef.current ?? alt);
                if (elevation > 0 && isRunning) {
                    cumulativeElevationRef.current += elevation;
                }
                lastElevationRef.current = alt;
                const cadence =
                    timeRef.current > 0
                        ? Math.round(
                              (stepCountRef.current / timeRef.current) * 60
                          )
                        : 0;
                const bpm = 0;
                const telemetry: Telemetry = {
                    timeStamp: timeStamp.toString(),
                    lat,
                    lng,
                    dist,
                    pace,
                    alt,
                    cadence,
                    bpm,
                    isRunning,
                };
                cumulativeDistanceRef.current = dist;
                lastLocationRef.current = location;
                setTelemetries((prev) => [...prev, telemetry]);
                if (isRunningRef.current) {
                    setSoloDashboardData((prev) => ({
                        distance: dist,
                        avgPace: pace,
                        avgCadence: cadence >= 1 ? cadence.toString() : "--",
                        gainElevation: cumulativeElevationRef.current,
                        calories: calories,
                        avgBpm: "--",
                    }));
                }
                setSegments((prev) => {
                    const lastSegment = prev.at(-1);
                    const newPoint = {
                        longitude: telemetry.lng,
                        latitude: telemetry.lat,
                    };

                    // 세그먼트가 아예 없을 때
                    if (!lastSegment) {
                        return [
                            {
                                isRunning: telemetry.isRunning,
                                points: [newPoint],
                            },
                        ];
                    }

                    const lastPoint = lastSegment.points.at(-1);

                    // 상태가 바뀌었을 경우 → 새 세그먼트 추가
                    if (
                        lastSegment.isRunning !== telemetry.isRunning &&
                        lastPoint
                    ) {
                        if (telemetry.isRunning) setHasPaused(true);
                        return [
                            ...prev,
                            {
                                isRunning: telemetry.isRunning,
                                points: [lastPoint, newPoint],
                            },
                        ];
                    }

                    // 상태가 같을 경우 → 기존 세그먼트에 point 추가
                    const updatedSegments = [...prev];
                    const updatedSegment = {
                        ...lastSegment,
                        points: [...lastSegment.points, newPoint],
                    };
                    updatedSegments[updatedSegments.length - 1] =
                        updatedSegment;

                    return updatedSegments;
                });
            }
        }, 1000);
    };

    // 달리기 종료
    const stopRunning = () => {
        setIsRunning(false);
        isRunningRef.current = false;
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        let pedometerSubscription: Pedometer.Subscription | null = null;

        const startTracking = async () => {
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                },
                (location) => {
                    locationRef.current = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        altitude: location.coords.altitude ?? 0,
                    };
                }
            );

            const isAvailable = await Pedometer.isAvailableAsync();
            if (isAvailable) {
                pedometerSubscription = Pedometer.watchStepCount((result) => {
                    pedometerRef.current = result.steps;
                });
            }
        };

        startTracking();

        return () => {
            locationSubscription?.remove();
            pedometerSubscription?.remove();
        };
    }, []);

    return {
        isRunning,
        runTime,
        soloDashboardData,
        segments,
        telemetries,
        startTime,
        hasPaused,
        startRunning,
        stopRunning,
    };
}
