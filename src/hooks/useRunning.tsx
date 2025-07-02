import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { Segment } from "../components/map/RunningLine";
import { Coordinate, getDistance } from "../utils/mapUtils";
import { getCalories, getPace, telemetriesToSegment } from "../utils/runUtils";

interface RunningProps {
    type: "free" | "course";
    mode: "solo" | "ghost";
    weight: number;
    ghostTelemetries?: Telemetry[];
}

interface UserDashBoardData {
    totalDistance: number;
    paceOfLast10Points: number;
    cadenceOfLast10Points: number;
    totalCalories: number;
    totalElevationGain: number;
    bpm: number;
}

interface GhostDashBoardData {
    totalDistance: number;
    cadenceOfLast10Points: number;
    paceOfLast10Points: number;
}

type LocationPoint = { lat: number; lng: number; alt: number };

export function useRunning({
    type,
    mode,
    weight,
    ghostTelemetries,
}: RunningProps) {
    const runtimeRef = useRef<number>(0);
    const [runTime, setRunTime] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [status, setStatus] = useState<
        "idle" | "running" | "paused" | "stopped" | "completed" | "waiting"
    >("idle");
    const [telemetries, setTelemetries] = useState<Telemetry[]>([]);
    const [hasPaused, setHasPaused] = useState<boolean>(false);
    const [completeIndex, setCompleteIndex] = useState<number>(0);
    const [stopCourseRun, setStopCourseRun] = useState<boolean>(false);

    const isTracking =
        status === "running" || status === "paused" || status === "completed";
    const isRunning = status === "running" || status === "completed";
    const shouldChangeUserDashboard = status === "running";
    const shouldChangeGhostDashboard = status === "running" && mode === "ghost";
    const shouldSyncCourse =
        type === "course" && (status === "stopped" || status === "idle");
    const [segments, setSegments] = useState<Segment[]>([]);

    const [courseIndex, setCourseIndex] = useState<number>(0);

    const [userDashboardData, setUserDashboardData] =
        useState<UserDashBoardData>({
            totalDistance: 0,
            paceOfLast10Points: 0,
            cadenceOfLast10Points: 0,
            totalCalories: 0,
            totalElevationGain: 0,
            bpm: 0,
        });
    const [ghostDashboardData, setGhostDashboardData] =
        useState<GhostDashBoardData>({
            totalDistance: 0,
            cadenceOfLast10Points: 0,
            paceOfLast10Points: 0,
        });

    const locationRef = useRef<LocationPoint | null>(null);

    const pedometerRef = useRef<number>(0);
    const lastPedometerRef = useRef<number>(0);
    const totalStepCountRef = useRef<number>(0);
    const stepCountsRef = useRef<number[]>([]);
    const tickDistancesRef = useRef<number[]>([]);

    const elevationGainRef = useRef<number>(0);
    const elevationLossRef = useRef<number>(0);

    function startTracking() {
        setStatus("running");
    }
    function idleTracking() {
        setStatus("idle");
    }
    function waitingTracking() {
        setStatus("waiting");
    }
    function pauseTracking() {
        setStatus("paused");
    }
    function stopTracking() {
        setStatus("stopped");
    }
    function completeTracking() {
        setStatus("completed");
    }
    function stopCourseAndFreeRun() {
        setStopCourseRun(true);
        waitingTracking();
    }

    const checkPointSynced = useCallback(
        (targetPosition: Coordinate, currentPosition: Coordinate) => {
            const distance = getDistance(targetPosition, currentPosition);
            console.log(distance);
            return distance < 5;
        },
        []
    );

    const findClosestPointIndex = useCallback(
        (currentPosition: Coordinate, telemetries: Telemetry[]) => {
            return telemetries.findIndex((telemetry) =>
                checkPointSynced(
                    { lat: telemetry.lat, lng: telemetry.lng },
                    currentPosition
                )
            );
        },
        [checkPointSynced]
    );

    useEffect(() => {
        if (stopCourseRun) {
            return;
        }
        if (shouldSyncCourse && ghostTelemetries) {
            let toastCount = 81;
            const syncInterval = setInterval(() => {
                const currentLocation = locationRef.current;
                const courseLocation = ghostTelemetries[courseIndex];
                if (!currentLocation || !courseLocation) return;

                if (checkPointSynced(courseLocation, currentLocation)) {
                    Toast.hide();
                    waitingTracking();
                    Toast.show({
                        type: courseIndex === 0 ? "info" : "success",
                        text1:
                            courseIndex === 0
                                ? "3초 뒤 러닝이 시작됩니다"
                                : "기록을 이어서 진행합니다",
                        position: "bottom",
                    });
                    clearInterval(syncInterval);
                } else {
                    if (courseIndex === 0) {
                        if (toastCount > 80) {
                            toastCount = 0;
                            Toast.show({
                                type: "info",
                                text1: "시작 지점으로 이동해 주세요",
                                position: "bottom",
                                visibilityTime: 2000,
                            });
                        } else {
                            toastCount++;
                        }
                    }
                }
            }, 50);
        }
    }, [
        shouldSyncCourse,
        ghostTelemetries,
        checkPointSynced,
        findClosestPointIndex,
        courseIndex,
        stopCourseRun,
    ]);

    useEffect(() => {
        if (!isTracking) return;

        const interval = setInterval(() => {
            if (!locationRef.current) return;

            if (
                type === "course" &&
                ghostTelemetries &&
                completeIndex === 0 &&
                !stopCourseRun
            ) {
                const courseIndex = findClosestPointIndex(
                    locationRef.current,
                    ghostTelemetries
                );
                if (courseIndex <= courseIndex) {
                    setCourseIndex(courseIndex);

                    if (courseIndex === ghostTelemetries.length - 1) {
                        completeTracking();
                    }
                } else {
                    stopTracking();
                    Toast.show({
                        type: "info",
                        text1: "코스를 이탈하였습니다",
                        position: "bottom",
                    });
                    return;
                }
            }

            const now = Date.now();
            const currentLocation = locationRef.current;

            const delta = pedometerRef.current - lastPedometerRef.current;
            lastPedometerRef.current = pedometerRef.current;
            if (isRunning) {
                totalStepCountRef.current += delta;
                stepCountsRef.current.push(delta);
                if (stepCountsRef.current.length > 10) {
                    stepCountsRef.current.shift();
                }
                if (!startTime) {
                    setStartTime(now);
                }
            }

            setTelemetries((prev) => {
                if (status === "completed") {
                    setCompleteIndex(prev.length);
                }
                setSegments((prev) => {
                    const point = {
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng,
                    };
                    const lastSegment = prev.at(-1);

                    // 첫 세그먼트 생성
                    if (!lastSegment) {
                        return [
                            {
                                isRunning: true,
                                points: [point],
                            },
                        ];
                    }

                    // 이전 세그먼트와 상태 동일 → 이어붙이기
                    if (lastSegment.isRunning === isRunning) {
                        return [
                            ...prev.slice(0, -1),
                            {
                                isRunning,
                                points: [...lastSegment.points, point],
                            },
                        ];
                    }

                    // 상태 전환됨 → 새로운 세그먼트 시작 (이전 점 + 현재 점)
                    return [
                        ...prev,
                        {
                            isRunning,
                            points: [lastSegment.points.at(-1)!, point],
                        },
                    ];
                });
                if (!isRunning) {
                    return [
                        ...prev,
                        {
                            timeStamp: now,
                            lat: currentLocation.lat,
                            lng: currentLocation.lng,
                            dist: prev.at(-1)?.dist ?? 0,
                            pace: 0,
                            alt: currentLocation.alt,
                            cadence: 0,
                            bpm: 0,
                            isRunning: false,
                        },
                    ];
                }
                runtimeRef.current += 1;
                const telemetries = [...prev];
                const lastTelemetry = telemetries.at(-1);
                if (lastTelemetry?.isRunning === false) setHasPaused(true);
                const runningTelemetries = telemetries
                    .filter((t) => t.isRunning)
                    .slice(-9);
                const pointLength = runningTelemetries.length;
                const stepCount = stepCountsRef.current
                    .slice(-(pointLength + 1))
                    .reduce((acc, curr) => acc + curr, 0);
                const tickDistance = lastTelemetry
                    ? getDistance(lastTelemetry, currentLocation)
                    : 0;
                const distance = lastTelemetry
                    ? lastTelemetry.dist + tickDistance
                    : tickDistance;
                tickDistancesRef.current.push(tickDistance);
                if (tickDistancesRef.current.length > 10) {
                    tickDistancesRef.current.shift();
                }
                const deltaDistance = tickDistancesRef.current
                    .slice(-(pointLength + 1))
                    .reduce((acc, curr) => acc + curr, 0);

                const avgPace = getPace(pointLength, deltaDistance);
                const avgCadence =
                    pointLength > 3 ? (stepCount / pointLength) * 60 : 0;

                const newTelemetry: Telemetry = {
                    timeStamp: now,
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    dist: distance,
                    pace: avgPace,
                    alt: currentLocation.alt,
                    cadence: avgCadence,
                    bpm: 0,
                    isRunning: true,
                };

                const elevation =
                    currentLocation.alt -
                    (lastTelemetry?.alt ?? currentLocation.alt);
                if (elevation > 0) {
                    elevationGainRef.current += elevation;
                } else {
                    elevationLossRef.current += elevation;
                }
                telemetries.push(newTelemetry);
                return telemetries;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [
        isTracking,
        isRunning,
        status,
        findClosestPointIndex,
        ghostTelemetries,
        type,
        startTime,
        completeIndex,
        stopCourseRun,
    ]);

    useEffect(() => {
        if (!shouldChangeUserDashboard) return;

        setRunTime(runtimeRef.current);
        setUserDashboardData((prev) => ({
            ...prev,
            totalDistance: telemetries.at(-1)?.dist ?? 0,
            paceOfLast10Points: telemetries.slice(-10).at(-1)?.pace ?? 0,
            cadenceOfLast10Points: telemetries.slice(-10).at(-1)?.cadence ?? 0,
            totalCalories: getCalories({
                distance: telemetries.at(-1)?.dist ?? 0,
                timeInSec: runtimeRef.current,
                weight: weight,
            }),
            totalElevationGain: elevationGainRef.current,
            bpm: 0,
        }));
    }, [shouldChangeUserDashboard, telemetries, weight]);

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
                        lat: Number(location.coords.latitude.toFixed(8)),
                        lng: Number(location.coords.longitude.toFixed(8)),
                        alt: Number((location.coords.altitude ?? 0).toFixed(2)),
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

        const stopTracking = () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
            if (pedometerSubscription) {
                pedometerSubscription.remove();
            }
        };

        startTracking();

        return () => stopTracking();
    }, []);

    const userSegments = useMemo(() => {
        if (
            ghostTelemetries &&
            (completeIndex === 0 || status === "completed") &&
            !stopCourseRun
        ) {
            return telemetriesToSegment(ghostTelemetries, courseIndex);
        } else {
            return segments;
        }
    }, [
        ghostTelemetries,
        completeIndex,
        status,
        segments,
        courseIndex,
        stopCourseRun,
    ]);

    return {
        completeIndex,
        startTime,
        status,
        startTracking,
        idleTracking,
        waitingTracking,
        pauseTracking,
        stopTracking,
        completeTracking,
        userDashboardData,
        ghostDashboardData,
        telemetries,
        runTime,
        isRunning,
        hasPaused,
        courseIndex,
        userSegments,
        stopCourseAndFreeRun,
        stopCourseRun,
    };
}
