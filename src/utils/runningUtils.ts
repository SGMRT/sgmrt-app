import AsyncStorage from "@react-native-async-storage/async-storage";
import { Telemetry } from "../apis/types/run";
import { Altitude, RunData, RunnningStatus, StepCount } from "../types/run";
import { findClosest } from "./interpolateTelemetries";

export async function removeRunData(sessionId: string) {
    console.log("================================================");
    console.log("[SESSION] 러닝 데이터 삭제", sessionId);
    const batch = await AsyncStorage.getItem(sessionId + "_batch");
    if (batch) {
        for (let i = 0; i <= Number(batch); i++) {
            await AsyncStorage.removeItem(sessionId + "_data_" + i);
        }
    }
    await AsyncStorage.removeItem(sessionId + "_status");
    await AsyncStorage.removeItem(sessionId + "_batch");
    await AsyncStorage.removeItem(sessionId + "_baseAltitude");
    await AsyncStorage.removeItem(sessionId + "_course");
    await AsyncStorage.removeItem(sessionId + "_type");
    await AsyncStorage.removeItem(sessionId + "_index");
    await AsyncStorage.removeItem(sessionId + "_stepCount");
    await AsyncStorage.removeItem(sessionId + "_altitude");
    await AsyncStorage.removeItem("sessionId");
    console.log("[SESSION] 러닝 데이터 삭제 완료", sessionId);
    console.log("================================================");
}

export async function getAllRunData(sessionId: string) {
    const batch = await AsyncStorage.getItem(sessionId + "_batch");
    if (!batch) return { data: [], batch: "0" };

    const runDataList: RunData[] = [];
    for (let i = 0; i <= Number(batch); i++) {
        const runData = await AsyncStorage.getItem(sessionId + "_data_" + i);
        if (runData) {
            runDataList.push(...JSON.parse(runData));
        }
    }
    return { data: getUniqueAndSortedRunData(runDataList), batch: batch };
}

export async function getRunDataFromBatch(
    sessionId: string,
    fromBatch: string
) {
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

export function mergeRunData(
    runDataList: RunData[],
    newRunDataList: RunData[]
) {
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

export async function getCurrentSessionId() {
    return await AsyncStorage.getItem("sessionId");
}

export async function getCurrentRunStatus(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_status");
}

export async function getCurrentRunBatch(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_batch");
}

export async function getCurrentRunDataOfBatch(
    sessionId: string,
    batch: string
) {
    return await AsyncStorage.getItem(sessionId + "_data_" + batch);
}

export async function setCurrentRunDataToBatch(
    sessionId: string,
    batch: string,
    data: string
) {
    return await AsyncStorage.setItem(sessionId + "_data_" + batch, data);
}

export async function setCurrentSessionId(sessionId: string) {
    return await AsyncStorage.setItem("sessionId", sessionId);
}

export async function setCurrentRunBatch(sessionId: string, batch: string) {
    return await AsyncStorage.setItem(sessionId + "_batch", batch);
}

export async function setCurrentRunStatus(
    sessionId: string,
    status: RunnningStatus
) {
    return await AsyncStorage.setItem(sessionId + "_status", status);
}

export async function setCurrentCourse(sessionId: string, course: Telemetry[]) {
    return await AsyncStorage.setItem(
        sessionId + "_course",
        JSON.stringify(course)
    );
}

export async function getCurrentCourse(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_course");
}

export async function setCurrentRunType(
    sessionId: string,
    type: "SOLO" | "COURSE"
) {
    return await AsyncStorage.setItem(sessionId + "_type", type);
}

export async function getCurrentRunType(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_type");
}

export async function setCurrentCourseIndex(sessionId: string, index: number) {
    return await AsyncStorage.setItem(sessionId + "_index", index.toString());
}

export async function getCurrentCourseIndex(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_index");
}

export function getOnlyNewData(target: RunData[], reference: RunData[]) {
    const referenceSet = new Set(reference.map((d) => d.timestamp));
    return target.filter((d) => !referenceSet.has(d.timestamp));
}

export async function getStepCount(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_stepCount");
}

export async function pushStepCount(sessionId: string, stepCount: StepCount) {
    const stepCountData = await getStepCount(sessionId);
    const stepCountList: StepCount[] = stepCountData
        ? JSON.parse(stepCountData)
        : [];
    stepCountList.push(stepCount);
    stepCountList.slice(-30);

    return await AsyncStorage.setItem(
        sessionId + "_stepCount",
        JSON.stringify(stepCountList)
    );
}

export async function getAltitude(sessionId: string) {
    return await AsyncStorage.getItem(sessionId + "_altitude");
}

export async function pushAltitude(sessionId: string, altitude: Altitude) {
    const altitudeData = await getAltitude(sessionId);
    const altitudeList: Altitude[] = altitudeData
        ? JSON.parse(altitudeData)
        : [];
    altitudeList.push(altitude);
    altitudeList.slice(-30);

    return await AsyncStorage.setItem(
        sessionId + "_altitude",
        JSON.stringify(altitudeList)
    );
}

export async function getClosestStepCount(
    sessionId: string,
    timestamp: number
) {
    const stepCountData = await getStepCount(sessionId);
    const stepCountList: StepCount[] = stepCountData
        ? JSON.parse(stepCountData)
        : [];

    const closest = findClosest(stepCountList, timestamp);

    if (!closest) return undefined;

    return closest.totalSteps;
}

export async function getClosestAltitude(sessionId: string, timestamp: number) {
    const altitudeData = await getAltitude(sessionId);
    const altitudeList: Altitude[] = altitudeData
        ? JSON.parse(altitudeData)
        : [];

    const closest = findClosest(altitudeList, timestamp);

    if (!closest) return undefined;

    return closest;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function pressureToAltitude(
    pressureHPa: number,
    seaLevelPressureHPa = 1013.25
): number {
    return (
        44330.77 * (1.0 - Math.pow(pressureHPa / seaLevelPressureHPa, 0.190284))
    );
}

export function setBaseAltitude(
    sessionId: string,
    pressure: number,
    altitude: number
) {
    return AsyncStorage.setItem(
        sessionId + "_baseAltitude",
        JSON.stringify({ pressure, altitude })
    );
}

export function getBaseAltitude(sessionId: string) {
    return AsyncStorage.getItem(sessionId + "_baseAltitude");
}
