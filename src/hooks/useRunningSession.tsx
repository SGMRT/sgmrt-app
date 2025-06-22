import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDistance } from "../utils/mapUtils";
import { getCalories, getPace } from "../utils/runUtils";

interface GpsSegment {
    isRunning: boolean;
    points: {
        latitude: number;
        longitude: number;
        altitude: number;
    }[];
}

export function useRunningSession() {
    const [isRunning, setIsRunning] = useState(true);
    const [runTime, setRunTime] = useState(0);
    const [segments, setSegments] = useState<GpsSegment[]>([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [stepCount, setStepCount] = useState(0);
    const [elevationGain, setElevationGain] = useState(0);

    const timerRef = useRef<number | null>(null);
    const stopTimerRef = useRef<number | null>(null);
    const pointRef = useRef<{
        latitude: number;
        longitude: number;
        altitude: number;
    } | null>(null);
    const stepCountRef = useRef(0);

    const addGpsPoint = useCallback(
        (
            point: { latitude: number; longitude: number; altitude: number },
            isRunning: boolean
        ) => {
            setSegments((prev) => {
                const last = prev[prev.length - 1];
                if (!last) return [{ isRunning: isRunning, points: [point] }];
                const lastPoint = last.points[last.points.length - 1];

                const dist =
                    lastPoint != null
                        ? getDistance(
                              [lastPoint.latitude, lastPoint.longitude],
                              [point.latitude, point.longitude]
                          )
                        : 0;

                if (dist < 100) {
                    if (isRunning) {
                        setTotalDistance((prevDist) => prevDist + dist);

                        if (point.altitude !== 0 && lastPoint) {
                            const gain = point.altitude - lastPoint.altitude;
                            if (gain > 0) {
                                setElevationGain((prevGain) => prevGain + gain);
                            }
                        }
                    }

                    return [
                        ...prev.slice(0, -1),
                        { ...last, points: [...last.points, point] },
                    ];
                }
                return prev;
            });
        },
        []
    );

    // 달리기 시작
    const startRunning = () => {
        if (timerRef.current) return;
        if (stopTimerRef.current) {
            clearInterval(stopTimerRef.current);
            stopTimerRef.current = null;
        }
        setIsRunning(true);
        timerRef.current = setInterval(() => {
            setRunTime((prev) => prev + 1);
            setStepCount(stepCountRef.current);
            if (pointRef.current) {
                addGpsPoint(pointRef.current, true);
            }
        }, 1000);
    };

    // 달리기 종료
    const stopRunning = () => {
        setIsRunning(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        stopTimerRef.current = setInterval(() => {
            if (pointRef.current) {
                addGpsPoint(pointRef.current, false);
            }
        }, 1000);
    };

    useEffect(() => {
        setSegments((prev) => {
            if (prev.length > 0) {
                const lastSegment = prev[prev.length - 1];
                const lastPoint =
                    lastSegment.points[lastSegment.points.length - 1];
                return [
                    ...prev,
                    {
                        isRunning,
                        points: [lastPoint],
                    },
                ];
            } else {
                return [{ isRunning, points: [] }];
            }
        });
    }, [isRunning]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        startRunning();
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (stopTimerRef.current) {
                clearInterval(stopTimerRef.current);
                stopTimerRef.current = null;
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
                    pointRef.current = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        altitude: location.coords.altitude ?? 0,
                    };
                }
            );

            const isAvailable = await Pedometer.isAvailableAsync();
            if (isAvailable) {
                pedometerSubscription = Pedometer.watchStepCount((result) => {
                    stepCountRef.current = result.steps;
                });
            }
        };

        startTracking();

        return () => {
            locationSubscription?.remove();
            pedometerSubscription?.remove();
        };
    }, []);

    const cadence =
        runTime > 1 && stepCount > 0
            ? Math.round((stepCount / runTime) * 60)
            : 0;

    const calories = getCalories({
        distance: totalDistance,
        timeInSec: runTime,
        weight: 70,
    });

    const pace = getPace(runTime, totalDistance);

    return {
        isRunning,
        runTime,
        segments,
        totalDistance,
        stepCount,
        elevationGain,
        cadence,
        calories,
        pace,
        startRunning,
        stopRunning,
    };
}
