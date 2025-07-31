import LiveActivities from "@/modules/expo-live-activity";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import { v4 as uuidv4 } from "uuid";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";
import { useAuthStore } from "../store/authState";
import {
    LOCATION_TASK,
    RunData,
    RunnningStatus,
    StepCount,
    UserDashBoardData,
} from "../types/run";
import { getDistance } from "../utils/mapUtils";
import {
    getClosestStepCount,
    getCurrentRunBatch,
    getCurrentRunDataOfBatch,
    getCurrentRunStatus,
    getCurrentSessionId,
    getOnlyNewData,
    getRunDataFromBatch,
    mergeRunData,
    pushStepCount,
    removeRunData,
    setCurrentRunBatch,
    setCurrentRunDataToBatch,
    setCurrentRunStatus,
    setCurrentRunType,
    setCurrentSessionId,
} from "../utils/runningUtils";
import {
    findClosestPointIndex,
    getCadence,
    getCalories,
    getFormattedPace,
    getPace,
} from "../utils/runUtils";

if (TaskManager.isTaskDefined(LOCATION_TASK)) {
    console.log("[SESSION] 기존 태스크 삭제");
    TaskManager.unregisterTaskAsync(LOCATION_TASK);
}

TaskManager.defineTask(
    LOCATION_TASK,
    async ({ data }: { data: { locations: Location.LocationObject[] } }) => {
        const batchSize = 100;
        const sessionId = await getCurrentSessionId();
        if (!sessionId) return;

        const runStatus = (await getCurrentRunStatus(
            sessionId
        )) as RunnningStatus;
        if (!runStatus) return;
        const runBatch = await getCurrentRunBatch(sessionId);
        if (!runBatch) return;

        const previousRunData = await getCurrentRunDataOfBatch(
            sessionId,
            runBatch
        );

        let runDataArray = previousRunData ? JSON.parse(previousRunData) : [];

        let lastRunData = runDataArray.at(-1);
        let lastTimestamp = lastRunData?.timestamp;
        let lastTotalStepCount = lastRunData?.totalSteps;

        if (runDataArray.length === 0) {
            const previous = await getCurrentRunDataOfBatch(
                sessionId,
                (Number(runBatch) - 1).toString()
            );
            if (previous) {
                lastRunData = JSON.parse(previous).at(-1);
                lastTimestamp = lastRunData?.timestamp;
                lastTotalStepCount = lastRunData?.totalSteps;
            }
        }

        const newRunData: RunData[] = [];

        for (const location of data.locations) {
            const currentTimestamp = location.timestamp;
            const stepCount = await getClosestStepCount(
                sessionId,
                currentTimestamp
            );

            let steps = 0;

            steps = stepCount
                ? stepCount - (lastTotalStepCount ?? stepCount)
                : 0;

            newRunData.push({
                timestamp: currentTimestamp,
                timeDiff:
                    currentTimestamp - (lastTimestamp ?? currentTimestamp),
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                speed: location.coords.speed,
                totalSteps: stepCount ?? lastTotalStepCount ?? 0,
                deltaSteps: steps,
                runStatus: runStatus,
            });

            lastTimestamp = currentTimestamp;
        }

        console.log("[RUN] 러닝 데이터 수신");

        runDataArray = [...runDataArray, ...newRunData];

        await setCurrentRunDataToBatch(
            sessionId,
            runBatch,
            JSON.stringify(runDataArray)
        );

        if (runDataArray.length >= batchSize) {
            const newRunBatch = (Number(runBatch) + 1).toString();
            await setCurrentRunBatch(sessionId, newRunBatch);
        }
    }
);

interface RunningSessionProps {
    restore?: boolean;
    course?: Telemetry[];
    type?: "SOLO" | "COURSE";
    recentPointNumber?: number;
    courseAcceptanceDistance?: number;
}

export default function useRunningSession({
    restore = false,
    course = [],
    type = "SOLO",
    recentPointNumber = 30,
    courseAcceptanceDistance = 10,
}: RunningSessionProps) {
    const { userInfo } = useAuthStore();
    const runData = useRef<RunData[]>([]);
    const [runSegments, setRunSegments] = useState<Segment[]>([]);
    const tempRunSegment = useRef<Segment | null>(null);
    const runTelemetries = useRef<Telemetry[]>([]);
    const runUserDashboardData = useRef<UserDashBoardData>({
        totalDistance: 0,
        totalCalories: 0,
        averagePace: 0,
        averageCadence: 0,
        recentPointsPace: 0,
        bpm: 0,
        totalElevationGain: 0,
        totalElevationLoss: 0,
    });
    const runType = useRef<"SOLO" | "COURSE">(type);

    const [sessionId, setSessionId] = useState<string>("");
    const [runStatus, setRunStatus] =
        useState<RunnningStatus>("before_running");
    const runBatch = useRef<string>("0");

    const startTimeRef = useRef<number | null>(null);
    const elapsedTime = useRef<number>(0);
    const pauseRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    const lastStopUpdateInfo = useRef<{
        timestamp: number;
        before: RunnningStatus;
    } | null>(null);

    const router = useRouter();

    const courseIndex = useRef<number>(0);

    const updateRunType = useCallback(
        async (type: "SOLO" | "COURSE") => {
            runType.current = type;
            if (sessionId) {
                await setCurrentRunType(sessionId, type);
            }
        },
        [sessionId]
    );

    const updateRunStatus = useCallback(
        async (status: RunnningStatus) => {
            if (
                lastStopUpdateInfo.current?.before === "complete_course_running"
            ) {
                updateRunType("SOLO");
            }

            setRunStatus(status);

            lastStopUpdateInfo.current = {
                timestamp: Date.now(),
                before: status,
            };

            if (sessionId) {
                await setCurrentRunStatus(sessionId, status);
            } else {
                const sessionId = await getCurrentSessionId();
                if (sessionId) {
                    await setCurrentRunStatus(sessionId, status);
                }
            }
        },
        [sessionId, updateRunType]
    );

    useEffect(() => {
        (async () => {
            const restoredSessionId = await getCurrentSessionId();

            if (restoredSessionId) {
                if (restore) {
                    // 복구
                } else {
                    await removeRunData(restoredSessionId);
                }
            }

            if (!restore || !restoredSessionId) {
                const newSessionId = uuidv4();
                console.log("================================================");
                console.log("[SESSION] 세션 생성", newSessionId);
                LiveActivities.endActivity();
                await setCurrentSessionId(newSessionId);
                await setCurrentRunStatus(newSessionId, runStatus);
                await setCurrentRunBatch(newSessionId, "0");
                await setCurrentRunType(newSessionId, type);
                console.log("[SESSION] 러닝 유형", type);
                setSessionId(newSessionId);
                await LiveActivities.startActivity(
                    new Date().toISOString(),
                    newSessionId,
                    type,
                    "0'00\"",
                    "0.0",
                    "0.0",
                    type === "COURSE" ? 0 : undefined
                );
                console.log("[SESSION] 세션 생성 완료", newSessionId);
                console.log("================================================");
            }

            await (async () => {
                const { status: status_fg } =
                    await Location.requestForegroundPermissionsAsync();

                if (status_fg !== "granted") {
                    Toast.show({
                        type: "info",
                        text1: "위치 권한이 필요합니다.",
                        position: "bottom",
                    });
                    router.back();
                }

                await Location.startLocationUpdatesAsync(LOCATION_TASK, {
                    accuracy: Location.Accuracy.BestForNavigation,
                    deferredUpdatesInterval: 3000,
                });

                const stepCountSubscription = Pedometer.watchStepCount(
                    async (result) => {
                        const stepCount: StepCount = {
                            totalSteps: result.steps,
                            timestamp: Date.now(),
                        };
                        const sessionId = await getCurrentSessionId();
                        if (sessionId) {
                            await pushStepCount(sessionId, stepCount);
                        }
                    }
                );

                return () => {
                    Location.stopLocationUpdatesAsync(LOCATION_TASK);
                    TaskManager.unregisterTaskAsync(LOCATION_TASK);
                    stepCountSubscription.remove();
                    LiveActivities.endActivity();
                };
            })();
        })();
    }, []);

    // 러닝 데이터 처리
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!sessionId || !runBatch.current) return;
            const { data: batchData, batch: batchCount } =
                await getRunDataFromBatch(sessionId, runBatch.current);

            const tempRunData = [
                ...runData.current.filter(
                    (data) =>
                        data.runStatus === "start_running" ||
                        data.runStatus === "stop_running" ||
                        data.runStatus === "complete_course_running"
                ),
            ];

            let newRunData: RunData[] = [];

            const mergedData = mergeRunData(runData.current, batchData);
            newRunData = getOnlyNewData(batchData, runData.current);

            newRunData.forEach((data) => {
                if (
                    runStatus === "before_running" &&
                    course.length > 0 &&
                    runType.current === "COURSE"
                ) {
                    const startPoint = course[0];
                    const distance = getDistance(
                        { lat: startPoint.lat, lng: startPoint.lng },
                        { lat: data.latitude, lng: data.longitude }
                    );
                    if (distance <= courseAcceptanceDistance) {
                        updateRunStatus("ready_course_running");
                    } else {
                        console.log(distance);
                        console.log("기준 미충족");
                    }
                }

                if (data.runStatus === "before_running") return;
                const lastTelemetry = runTelemetries.current.at(-1);
                if (
                    runStatus === "start_running" ||
                    runStatus === "stop_running" ||
                    runStatus === "complete_course_running"
                ) {
                    if (!lastTelemetry) {
                        runTelemetries.current.push({
                            timeStamp: data.timestamp,
                            lat: data.latitude,
                            lng: data.longitude,
                            dist: 0,
                            pace: 0,
                            alt: data.altitude ?? 0,
                            cadence: 0,
                            bpm: 0,
                            isRunning: true,
                        });
                        runUserDashboardData.current = {
                            totalDistance: 0,
                            totalCalories: 0,
                            averagePace: 0,
                            averageCadence: 0,
                            recentPointsPace: 0,
                            bpm: 0,
                            totalElevationGain: 0,
                            totalElevationLoss: 0,
                        };
                    } else {
                        const recentRunData = tempRunData.slice(
                            -recentPointNumber
                        );
                        const recentTelemetries = runTelemetries.current
                            .filter((telemetry) => telemetry.isRunning)
                            .slice(-recentPointNumber);
                        const recentPointsLength = recentRunData.length;
                        const distance =
                            lastTelemetry.dist +
                            getDistance(
                                {
                                    lat: lastTelemetry.lat,
                                    lng: lastTelemetry.lng,
                                },
                                {
                                    lat: data.latitude,
                                    lng: data.longitude,
                                }
                            );
                        const elapsedTime =
                            ((runTelemetries.current.at(-1)?.timeStamp ??
                                data.timestamp) -
                                (runTelemetries.current.at(0)?.timeStamp ??
                                    data.timestamp)) /
                            1000;
                        const pace = getPace(elapsedTime, distance);
                        const cadence = getCadence(
                            tempRunData.reduce(
                                (acc, curr) => acc + (curr.deltaSteps ?? 0),
                                0
                            ) + (data.deltaSteps ?? 0),
                            elapsedTime
                        );
                        const bpm = 0;
                        const calories = getCalories({
                            distance,
                            timeInSec: elapsedTime,
                            weight: userInfo?.weight ?? 70,
                        });
                        const recentPointsPace =
                            recentPointsLength < recentPointNumber
                                ? pace
                                : getPace(
                                      (data.timeDiff +
                                          recentRunData.reduce(
                                              (acc, curr) =>
                                                  acc + curr.timeDiff,
                                              0
                                          )) /
                                          1000,
                                      distance -
                                          (recentTelemetries.at(0)?.dist ?? 0)
                                  );
                        const altitude = Math.round(data.altitude ?? 0);
                        const lastAltitude = Math.round(lastTelemetry.alt ?? 0);
                        const elevation = altitude - lastAltitude;

                        runTelemetries.current.push({
                            timeStamp: data.timestamp,
                            lat: data.latitude,
                            lng: data.longitude,
                            dist: distance,
                            pace: recentPointsPace,
                            alt: data.altitude ?? 0,
                            cadence: cadence,
                            bpm: bpm,
                            isRunning: true,
                        });
                        if (runStatus === "start_running") {
                            runUserDashboardData.current = {
                                totalDistance: distance,
                                totalCalories: calories,
                                averagePace: pace,
                                averageCadence: cadence,
                                recentPointsPace: recentPointsPace,
                                bpm: bpm,
                                totalElevationGain:
                                    elevation > 0
                                        ? runUserDashboardData.current
                                              .totalElevationGain + elevation
                                        : runUserDashboardData.current
                                              .totalElevationGain,
                                totalElevationLoss:
                                    elevation < 0
                                        ? runUserDashboardData.current
                                              .totalElevationLoss + elevation
                                        : runUserDashboardData.current
                                              .totalElevationLoss,
                            };
                        }
                        tempRunData.push(data);
                    }
                } else {
                    if (!lastTelemetry) return;
                    runTelemetries.current.push({
                        timeStamp: lastTelemetry.timeStamp,
                        lat: data.latitude,
                        lng: data.longitude,
                        dist: lastTelemetry.dist,
                        pace: lastTelemetry.pace,
                        alt: data.altitude ?? 0,
                        cadence: lastTelemetry.cadence,
                        bpm: lastTelemetry.bpm,
                        isRunning: false,
                    });
                }
            });

            runData.current = mergedData;

            setRunSegments((prev) => {
                const segments = prev.map((seg) => ({
                    ...seg,
                    points: [...seg.points],
                }));

                newRunData.forEach((data) => {
                    if (
                        tempRunSegment.current &&
                        data.runStatus === "start_running"
                    ) {
                        console.log("탬프 세그먼트 추가");
                        segments.push(tempRunSegment.current);
                        tempRunSegment.current = null;
                    }

                    const lastSegment = segments.at(-1);
                    const lastPoint = lastSegment?.points.at(-1);

                    if (
                        data.runStatus === "before_running" ||
                        data.runStatus === "ready_course_running"
                    ) {
                        return;
                    } else if (
                        data.runStatus === "stop_running" ||
                        data.runStatus === "complete_course_running"
                    ) {
                        if (tempRunSegment.current) {
                            tempRunSegment.current.points.push({
                                latitude: data.latitude,
                                longitude: data.longitude,
                            });
                        } else {
                            tempRunSegment.current = {
                                isRunning: true,
                                points: [
                                    lastPoint && {
                                        latitude: lastPoint.latitude,
                                        longitude: lastPoint.longitude,
                                    },
                                    {
                                        latitude: data.latitude,
                                        longitude: data.longitude,
                                    },
                                ].filter(Boolean) as {
                                    latitude: number;
                                    longitude: number;
                                }[],
                            };
                        }
                        return;
                    }

                    if (segments.length === 0) {
                        segments.push({
                            isRunning: runStatus === "start_running",
                            points: [
                                {
                                    latitude: data.latitude,
                                    longitude: data.longitude,
                                },
                            ],
                        });
                    } else {
                        if (!lastSegment || !lastPoint) return;

                        if (
                            lastSegment.isRunning ===
                            (runStatus === "start_running")
                        ) {
                            lastSegment.points.push({
                                latitude: data.latitude,
                                longitude: data.longitude,
                            });
                        } else {
                            segments.push({
                                isRunning: runStatus === "start_running",
                                points: [
                                    {
                                        latitude: lastPoint.latitude,
                                        longitude: lastPoint.longitude,
                                    },
                                    {
                                        latitude: data.latitude,
                                        longitude: data.longitude,
                                    },
                                ],
                            });
                        }
                    }
                });

                return segments;
            });

            runBatch.current = batchCount;

            if (
                course.length > 0 &&
                runStatus === "start_running" &&
                runType.current === "COURSE"
            ) {
                const lastTelemetry = runTelemetries.current.at(-1);
                if (lastTelemetry) {
                    const closestCourseIndex = findClosestPointIndex(
                        { lat: lastTelemetry.lat, lng: lastTelemetry.lng },
                        course,
                        courseAcceptanceDistance
                    );
                    if (courseIndex.current + 2 >= course.length) {
                        updateRunStatus("complete_course_running");
                    }
                    if (closestCourseIndex === -1) {
                        updateRunStatus("stop_running");
                    } else if (closestCourseIndex > courseIndex.current) {
                        courseIndex.current = closestCourseIndex;
                    }
                }
            }

            if (LiveActivities.isActivityInProgress()) {
                LiveActivities.updateActivity(
                    new Date(startTimeRef.current ?? Date.now()).toISOString(),
                    getFormattedPace(runUserDashboardData.current.averagePace),
                    (runUserDashboardData.current.totalDistance / 1000)
                        .toFixed(2)
                        .toString(),
                    runUserDashboardData.current.totalCalories
                        .toFixed(0)
                        .toString(),
                    pauseRef.current
                        ? new Date(pauseRef.current).toISOString()
                        : undefined,
                    courseIndex.current
                        ? (courseIndex.current + 1) / course.length
                        : undefined
                );
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            console.log("[SESSION] 러닝 데이터 처리 종료");
        };
    }, [
        recentPointNumber,
        runStatus,
        sessionId,
        userInfo?.weight,
        courseAcceptanceDistance,
        updateRunStatus,
        course,
    ]);

    // 러닝 시간 처리
    useEffect(() => {
        if (
            runStatus === "start_running" ||
            runStatus === "stop_running" ||
            runStatus === "complete_course_running"
        ) {
            // resume from pause
            const now = Date.now();
            if (pauseRef.current) {
                const pauseDuration = Math.floor(
                    (now - pauseRef.current) / 1000
                );
                startTimeRef.current = startTimeRef.current
                    ? startTimeRef.current + pauseDuration * 1000
                    : now;
                pauseRef.current = null;
            }

            if (!startTimeRef.current) {
                startTimeRef.current = now; // 처음 시작한 경우
            }

            intervalRef.current = setInterval(() => {
                if (startTimeRef.current && runStatus === "start_running") {
                    elapsedTime.current = Math.floor(
                        (Date.now() - startTimeRef.current) / 1000
                    );
                }
            }, 1000);
        } else if (runStatus === "pause_running") {
            pauseRef.current = Date.now();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [runStatus]);

    const userTelemetries = useMemo(() => {
        if (
            runStatus === "stop_running" ||
            runStatus === "complete_course_running"
        ) {
            const stopInfo = lastStopUpdateInfo.current;
            if (!stopInfo) return runTelemetries.current;
            return runTelemetries.current.filter(
                (telemetry) => telemetry.timeStamp <= stopInfo.timestamp
            );
        } else return runTelemetries.current;
    }, [runStatus]);

    return {
        currentRunType: runType.current,
        runData: runData.current,
        runSegments,
        runTelemetries: userTelemetries,
        sessionId,
        updateRunStatus,
        updateRunType,
        runStatus,
        runTime: elapsedTime.current,
        runUserDashboardData: runUserDashboardData.current,
        courseIndex: courseIndex.current,
    };
}
