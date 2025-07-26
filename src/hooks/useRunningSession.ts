import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
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
    UserDashBoardData,
} from "../types/run";
import { getDistance } from "../utils/mapUtils";
import {
    getCurrentCourse,
    getCurrentCourseIndex,
    getCurrentRunBatch,
    getCurrentRunDataOfBatch,
    getCurrentRunStatus,
    getCurrentRunType,
    getCurrentSessionId,
    getOnlyNewData,
    getRunDataFromBatch,
    mergeRunData,
    removeRunData,
    setCurrentCourse,
    setCurrentCourseIndex,
    setCurrentRunBatch,
    setCurrentRunDataToBatch,
    setCurrentRunStatus,
    setCurrentRunType,
    setCurrentSessionId,
} from "../utils/runningUtils";
import { getCadence, getCalories, getPace } from "../utils/runUtils";

async function setTaskManager(taskName: string) {
    console.log("================================================");
    if (TaskManager.isTaskDefined(taskName)) {
        console.log("[SESSION] 기존 태스크 삭제");
        await TaskManager.unregisterTaskAsync(taskName);
    }

    const batchSize = 100;
    const sessionId = await getCurrentSessionId();
    console.log("[SESSION] 태스크 매니저 설정", sessionId);
    if (!sessionId) return;

    const course = await getCurrentCourse(sessionId);
    const runType = await getCurrentRunType(sessionId);

    TaskManager.defineTask(
        taskName,
        async ({
            data,
        }: {
            data: { locations: Location.LocationObject[] };
        }) => {
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

            let runDataArray = previousRunData
                ? JSON.parse(previousRunData)
                : [];

            let lastRunData = runDataArray.at(-1);
            let lastTimestamp = lastRunData?.timestamp;

            const newRunData: RunData[] = [];

            for (const location of data.locations) {
                const currentTimestamp = location.timestamp;

                let stepCount = 0;
                try {
                    const result = await Pedometer.getStepCountAsync(
                        new Date(lastTimestamp),
                        new Date(currentTimestamp)
                    );
                    stepCount = result.steps;
                } catch (error) {
                    // console.warn("걸음 수 가져오기 실패:", error);
                }

                newRunData.push({
                    timestamp: currentTimestamp,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    altitude: location.coords.altitude,
                    speed: location.coords.speed,
                    steps: stepCount,
                    runStatus: runStatus,
                });

                lastTimestamp = currentTimestamp;
            }

            console.log("[RUN] 러닝 데이터 수신", newRunData.at(-1));

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

            if (runType === "COURSE") {
                const courseIndex = await getCurrentCourseIndex(sessionId);
                console.log("[SESSION] 코스 관련 데이터 업데이트", courseIndex);
            }
        }
    );
    console.log("================================================");
}

export default function useRunningSession(
    restore: boolean = false,
    course: Telemetry[] = [],
    type: "SOLO" | "COURSE" = "SOLO",
    recentPointNumber: number = 30
) {
    const { userInfo } = useAuthStore();
    const runData = useRef<RunData[]>([]);
    const [runSegments, setRunSegments] = useState<Segment[]>([]);
    const runTelemetries = useRef<Telemetry[]>([]);
    const runUserDashboardData = useRef<UserDashBoardData>({
        totalDistance: 0,
        totalCalories: 0,
        averagePace: 0,
        averageCadence: 0,
        recentPointsPace: 0,
        bpm: 0,
    });

    const [sessionId, setSessionId] = useState<string>("");
    const [runStatus, setRunStatus] =
        useState<RunnningStatus>("before_running");
    const runBatch = useRef<string>("0");

    const [startTime, setStartTime] = useState<number | null>(null);
    const elapsedTime = useRef<number>(0);
    const pauseRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    const router = useRouter();

    async function updateRunStatus(status: RunnningStatus) {
        setRunStatus(status);
        if (sessionId) {
            await setCurrentRunStatus(sessionId, status);
        } else {
            const sessionId = await getCurrentSessionId();
            if (sessionId) {
                await setCurrentRunStatus(sessionId, status);
            }
        }
    }

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
                await setCurrentSessionId(newSessionId);
                await setCurrentRunStatus(newSessionId, runStatus);
                await setCurrentRunBatch(newSessionId, "0");
                await setCurrentRunType(newSessionId, type);
                console.log("[SESSION] 러닝 유형", type);
                if (course.length > 0) {
                    console.log("[SESSION] 코스 러닝 설정");
                    await setCurrentCourse(newSessionId, course);
                    await setCurrentCourseIndex(newSessionId, 0);
                }
                setSessionId(newSessionId);
                console.log("[SESSION] 세션 생성 완료", newSessionId);
                console.log("================================================");
            }

            await setTaskManager(LOCATION_TASK);
        })();

        (async () => {
            const { status: status_fg } =
                await Location.requestForegroundPermissionsAsync();
            const { status: status_bg } =
                await Location.requestBackgroundPermissionsAsync();

            if (status_fg !== "granted" || status_bg !== "granted") {
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

            return () => {
                Location.stopLocationUpdatesAsync(LOCATION_TASK);
                TaskManager.unregisterTaskAsync(LOCATION_TASK);
            };
        })();
    }, []);

    // 러닝 데이터 처리
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!sessionId || !runBatch.current) return;
            const { data: batchData, batch: batchCount } =
                await getRunDataFromBatch(sessionId, runBatch.current);

            let newRunData: RunData[] = [];

            const mergedData = mergeRunData(runData.current, batchData);
            newRunData = getOnlyNewData(batchData, runData.current);

            newRunData.forEach((data) => {
                if (data.runStatus === "before_running") return;
                const lastTelemetry = runTelemetries.current.at(-1);
                if (runStatus === "start_running") {
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
                        };
                    } else {
                        const recentPoints = runTelemetries.current
                            .filter((telemetry) => telemetry.isRunning)
                            .slice(-recentPointNumber);
                        const recentPointsLength = recentPoints.length;
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
                        const pace = getPace(elapsedTime.current, distance);
                        const cadence = getCadence(
                            data.steps ?? 0,
                            elapsedTime.current
                        );
                        const bpm = 0;
                        const calories = getCalories({
                            distance,
                            timeInSec: elapsedTime.current,
                            weight: userInfo?.weight ?? 70,
                        });
                        const recentPointsPace =
                            recentPointsLength < recentPointNumber
                                ? pace
                                : getPace(
                                      (data.timestamp -
                                          (recentPoints.at(0)?.timeStamp ??
                                              data.timestamp)) /
                                          1000,
                                      distance - (recentPoints.at(0)?.dist ?? 0)
                                  );
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
                        runUserDashboardData.current = {
                            totalDistance: distance,
                            totalCalories: calories,
                            averagePace: pace,
                            averageCadence: cadence,
                            recentPointsPace: recentPointsPace,
                            bpm: bpm,
                        };
                    }
                } else {
                    if (!lastTelemetry) return;
                    runTelemetries.current.push({
                        timeStamp: data.timestamp,
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
                    if (data.runStatus === "before_running") return;
                    if (segments.length === 0) {
                        segments.push({
                            isRunning: data.runStatus === "start_running",
                            points: [
                                {
                                    latitude: data.latitude,
                                    longitude: data.longitude,
                                },
                            ],
                        });
                    } else {
                        const lastSegment = segments.at(-1);
                        const currentDataIsRunning =
                            data.runStatus === "start_running";
                        if (!lastSegment) return;

                        if (lastSegment.isRunning === currentDataIsRunning) {
                            lastSegment.points.push({
                                latitude: data.latitude,
                                longitude: data.longitude,
                            });
                        } else {
                            segments.push({
                                isRunning: currentDataIsRunning,
                                points: [
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
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [recentPointNumber, runStatus, sessionId, userInfo?.weight]);

    // 러닝 시간 처리
    useEffect(() => {
        if (runStatus === "start_running") {
            // resume from pause
            const now = Date.now();
            if (pauseRef.current) {
                const pauseDuration = Math.floor(
                    (now - pauseRef.current) / 1000
                );
                setStartTime((prev) =>
                    prev ? prev + pauseDuration * 1000 : now
                );
                pauseRef.current = null;
            }

            if (!startTime) {
                setStartTime(now); // 처음 시작한 경우
            }

            intervalRef.current = setInterval(() => {
                if (startTime) {
                    elapsedTime.current = Math.floor(
                        (Date.now() - startTime) / 1000
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
    }, [runStatus, startTime]);

    return {
        runData: runData.current,
        runSegments,
        sessionId,
        updateRunStatus,
        runStatus,
        runTime: elapsedTime.current,
        runUserDashboardData: runUserDashboardData.current,
    };
}
