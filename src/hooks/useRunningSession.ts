import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import "react-native-get-random-values";
import Toast from "react-native-toast-message";
import { v4 as uuidv4 } from "uuid";

export interface RunData {
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed: number | null;
}

const LOCATION_TASK = "running-session";

if (!TaskManager.isTaskDefined(LOCATION_TASK)) {
    TaskManager.defineTask(
        LOCATION_TASK,
        async ({
            data,
        }: {
            data: { locations: Location.LocationObject[] };
        }) => {
            const sessionId = await AsyncStorage.getItem("sessionId");
            const runStatus = await AsyncStorage.getItem(sessionId + "_status");
            let runBatch = await AsyncStorage.getItem(sessionId + "_batch");
            const batchSize = 100;

            if (!sessionId || !runStatus || runStatus === "before_running")
                return;

            if (!runBatch) {
                runBatch = "0";
                await AsyncStorage.setItem(sessionId + "_batch", runBatch);
            }

            const previousRunData = await AsyncStorage.getItem(
                sessionId + "_data_" + runBatch
            );

            let runDataArray = previousRunData
                ? JSON.parse(previousRunData)
                : [];

            const newRunData = data.locations.map((location) => ({
                timestamp: location.timestamp,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                speed: location.coords.speed,
            }));

            runDataArray = [...runDataArray, ...newRunData];

            await AsyncStorage.setItem(
                sessionId + "_data_" + runBatch,
                JSON.stringify(runDataArray)
            );

            if (runDataArray.length >= batchSize) {
                runBatch = (Number(runBatch) + 1).toString();
                await AsyncStorage.setItem(sessionId + "_batch", runBatch);
            }
        }
    );
}

export default function useRunningSession() {
    const [runData, setRunData] = useState<RunData[]>([]);
    const sessionId = useRef<string>("");
    const runBatch = useRef<string>("0");

    useEffect(() => {
        (async () => {
            const restoredSessionId = await AsyncStorage.getItem("sessionId");

            if (restoredSessionId) {
                // 나중에 복구 기능 추가
                await removeRunData(restoredSessionId);
            }
            const newSessionId = uuidv4();
            await AsyncStorage.setItem("sessionId", newSessionId);
            sessionId.current = newSessionId;
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
            };
        })();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!sessionId.current || !runBatch.current) return;
            const { data, batch } = await getRunDataFromBatch(
                sessionId.current,
                runBatch.current
            );
            setRunData((prev) => mergeRunData(prev, data));
            runBatch.current = batch;
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [runBatch]);

    return runData;
}

async function removeRunData(sessionId: string) {
    const batch = await AsyncStorage.getItem(sessionId + "_batch");
    if (batch) {
        for (let i = 0; i <= Number(batch); i++) {
            await AsyncStorage.removeItem(sessionId + "_data_" + i);
        }
    }
    await AsyncStorage.removeItem(sessionId + "_status");
    await AsyncStorage.removeItem(sessionId + "_batch");
    await AsyncStorage.removeItem("sessionId");
}

async function getAllRunData(sessionId: string) {
    const batch = await AsyncStorage.getItem(sessionId + "_batch");
    if (!batch) return { data: [], batch: "0" };

    const runDataList: RunData[] = [];
    for (let i = 0; i < Number(batch); i++) {
        const runData = await AsyncStorage.getItem(sessionId + "_data_" + i);
        if (runData) {
            runDataList.push(...JSON.parse(runData));
        }
    }
    return { data: getUniqueAndSortedRunData(runDataList), batch: batch };
}

async function getRunDataFromBatch(sessionId: string, fromBatch: string) {
    const endBatch = await AsyncStorage.getItem(sessionId + "_batch");
    if (!endBatch) return { data: [], batch: "0" };
    if (Number(endBatch) < Number(fromBatch)) return { data: [], batch: "0" };

    const runDataList: RunData[] = [];
    for (let i = Number(fromBatch); i <= Number(endBatch); i++) {
        const runData = await AsyncStorage.getItem(sessionId + "_data_" + i);
        if (runData) {
            runDataList.push(...JSON.parse(runData));
        }
    }
    return { data: runDataList, batch: endBatch };
}

function mergeRunData(runDataList: RunData[], newRunDataList: RunData[]) {
    const allRunData = [...runDataList, ...newRunDataList];
    return getUniqueAndSortedRunData(allRunData);
}

function getUniqueAndSortedRunData(runDataList: RunData[]) {
    const byTimestamp = new Map<number, RunData>();
    for (const data of runDataList) {
        byTimestamp.set(data.timestamp, data);
    }

    return Array.from(byTimestamp.values()).sort(
        (a, b) => a.timestamp - b.timestamp
    );
}
