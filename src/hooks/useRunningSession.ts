import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import { v4 as uuidv4 } from "uuid";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";
import { LOCATION_TASK, RunData, RunnningStatus } from "../types/run";
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

async function setTaskManager(taskName: string) {
    console.log("================================================");
    console.log("[SESSION] 태스크 매니저 설정", taskName);
    if (TaskManager.isTaskDefined(taskName)) {
        console.log("[SESSION] 기존 태스크 삭제");
        await TaskManager.unregisterTaskAsync(taskName);
    }

    const batchSize = 100;
    const sessionId = await getCurrentSessionId();

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

            const newRunData: RunData[] = data.locations.map((location) => ({
                timestamp: location.timestamp,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                speed: location.coords.speed,
                runStatus: runStatus,
            }));

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
    type: "SOLO" | "COURSE" = "SOLO"
) {
    const runData = useRef<RunData[]>([]);
    const [runSegments, setRunSegments] = useState<Segment[]>([]);
    const sessionId = useRef<string>("");
    const runBatch = useRef<string>("0");

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
                await setCurrentRunStatus(newSessionId, "before_running");
                await setCurrentRunBatch(newSessionId, "0");
                await setCurrentRunType(newSessionId, type);
                console.log("[SESSION] 러닝 유형", type);
                if (course.length > 0) {
                    console.log("[SESSION] 코스 러닝 설정");
                    await setCurrentCourse(newSessionId, course);
                    await setCurrentCourseIndex(newSessionId, 0);
                }
                sessionId.current = newSessionId;
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
                return;
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

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!sessionId.current || !runBatch.current) return;
            const { data: batchData, batch: batchCount } =
                await getRunDataFromBatch(sessionId.current, runBatch.current);

            let newRunData: RunData[] = [];

            const mergedData = mergeRunData(runData.current, batchData);
            newRunData = getOnlyNewData(runData.current, batchData);

            runData.current = mergedData;

            setRunSegments((prev) => {
                const segments = prev.map((seg) => ({
                    ...seg,
                    points: [...seg.points],
                }));

                newRunData.forEach((data) => {
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
    }, []);

    return { runData: runData.current, runSegments };
}
