import { useCallback, useEffect, useRef, useState } from "react";
import { getRunTelemetries, getRunTelemetriesByCourseId } from "../apis";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";
import { Coordinate } from "../utils/mapUtils";
import { getCadence, getCalories, getPace } from "../utils/runUtils";
import useRunningSensors, { MergedRecord } from "./sensors/useRunningSensors";

interface RunningProps {
    type: "free" | "course";
    mode: "solo" | "ghost";
    weight: number;
    ghostRunningId?: number;
    courseId?: number;
}

type RunningStatus =
    | "before_running"
    | "course_running"
    | "free_running"
    | "paused"
    | "stopped"
    | "completed";

export interface UserDashBoardData {
    totalDistance: number;
    paceOfLastPoints: number;
    cadenceOfLastPoints: number;
    totalCalories: number;
    totalElevationGain: number;
    totalElevationLoss: number;
    bpm: number;
}

function getRecordsAfter(
    records: MergedRecord[],
    timestamp: number,
    maxCount: number
) {
    return records
        .filter((record) => record.timestamp > timestamp)
        .slice(-maxCount);
}

export default function useRunning({
    type,
    mode,
    weight,
    ghostRunningId,
    courseId,
}: RunningProps) {
    const { mergedRecords } = useRunningSensors({ intervalMs: 1000 });
    const [courseData, setCourseData] = useState<Coordinate[]>([]);
    const [ghostData, setGhostData] = useState<Coordinate[]>([]);

    const [completedAt, setCompletedAt] = useState<number | null>(null);
    const [status, setStatus] = useState<RunningStatus>("before_running");

    const activeRef = useRef<number | null>(null);
    const baseAltitudeRef = useRef<number | null>(null);

    const telemetryRef = useRef<Telemetry[]>([]);

    const [segments, setSegments] = useState<Segment[]>([]);
    const [userDashboardData, setUserDashboardData] =
        useState<UserDashBoardData>({
            totalDistance: 0,
            paceOfLastPoints: 0,
            cadenceOfLastPoints: 0,
            totalCalories: 0,
            totalElevationGain: 0,
            totalElevationLoss: 0,
            bpm: 0,
        });

    const [runTime, setRunTime] = useState<number>(0);
    const runTimeRef = useRef<number>(0);

    const setRunningStatus = useCallback((status: RunningStatus) => {
        if (status === "course_running" || status === "free_running") {
            activeRef.current = Date.now();
        } else if (status === "completed") {
            setCompletedAt(Date.now());
        }
        setStatus(status);
    }, []);

    // 코스 데이터 가져오기
    useEffect(() => {
        if (type === "course" && !!courseId) {
            getRunTelemetriesByCourseId(courseId).then((data) => {
                setCourseData(data);
            });
        }

        if (mode === "ghost" && !!ghostRunningId) {
            getRunTelemetries(ghostRunningId).then((data) => {
                setGhostData(data);
            });
        }
    }, [type, mode, courseId, ghostRunningId]);

    useEffect(() => {
        const currentRecord = mergedRecords.at(-1);
        console.log(currentRecord);
        if (currentRecord === undefined) return;
        const deltaDistanceM = currentRecord.deltaDistanceM;
        const deltaStep = currentRecord.deltaStep;
        if (status === "before_running" || status === "stopped") {
            // Do nothing
            return;
        } else if (status === "paused") {
            // 러닝 중지 상태 데이터 저장
            const lastTelemetry = telemetryRef.current.at(-1);
            telemetryRef.current.push({
                timeStamp: currentRecord.timestamp,
                lat: currentRecord.lat,
                lng: currentRecord.lng,
                dist: lastTelemetry?.dist ?? 0,
                pace: 0,
                alt: 0,
                cadence: 0,
                bpm: 0,
                isRunning: false,
            });
        } else {
            // 러닝 중 상태 데이터 저장
            runTimeRef.current += 1;
            setRunTime(runTimeRef.current);
            if (telemetryRef.current.length === 0) {
                baseAltitudeRef.current = currentRecord.relativeAltitude ?? 0;
                telemetryRef.current.push({
                    timeStamp: currentRecord.timestamp,
                    lat: currentRecord.lat,
                    lng: currentRecord.lng,
                    dist: deltaDistanceM ?? 0,
                    pace: deltaDistanceM ? getPace(1, deltaDistanceM) : 0,
                    alt: 0,
                    cadence: deltaStep ? getCadence(deltaStep, 1) : 0,
                    bpm: 0,
                    isRunning: true,
                });
            } else {
                const recordsAfter = getRecordsAfter(
                    mergedRecords,
                    activeRef.current!,
                    30
                );
                const cumulativeDistanceM = recordsAfter.reduce(
                    (acc, record) => acc + record.deltaDistanceM,
                    0
                );
                const cumulativeStep = recordsAfter.reduce(
                    (acc, record) => acc + record.deltaStep,
                    0
                );

                telemetryRef.current.push({
                    timeStamp: currentRecord.timestamp,
                    lat: currentRecord.lat,
                    lng: currentRecord.lng,
                    dist:
                        (telemetryRef.current.at(-1)?.dist ?? 0) +
                        (deltaDistanceM ?? 0),
                    pace: getPace(recordsAfter.length, cumulativeDistanceM),
                    alt:
                        (currentRecord.relativeAltitude ?? 0) -
                        (baseAltitudeRef.current ?? 0),
                    cadence: getCadence(cumulativeStep, recordsAfter.length),
                    bpm: 0,
                    isRunning: true,
                });
            }
            // 러닝 중일 경우 대시보드 데이터 업데이트
            const lastTelemetry = telemetryRef.current
                .filter((telemetry) => telemetry.isRunning)
                .at(-1);
            setUserDashboardData({
                totalDistance: lastTelemetry?.dist ?? 0,
                paceOfLastPoints: lastTelemetry?.pace ?? 0,
                cadenceOfLastPoints: lastTelemetry?.cadence ?? 0,
                totalCalories: getCalories({
                    distance: lastTelemetry?.dist ?? 0,
                    timeInSec: runTimeRef.current,
                    weight: weight,
                }),
                totalElevationGain: telemetryRef.current.reduce(
                    (acc, telemetry) => {
                        if (telemetry.alt > 0) {
                            return acc + telemetry.alt;
                        }
                        return acc;
                    },
                    0
                ),
                totalElevationLoss: telemetryRef.current.reduce(
                    (acc, telemetry) => {
                        if (telemetry.alt < 0) {
                            return acc + telemetry.alt;
                        }
                        return acc;
                    },
                    0
                ),
                bpm: 0,
            });
        }
        setSegments((prev) => {
            const lastTelemetry = telemetryRef.current.at(-1);
            const lastSegment = prev.at(-1);
            if (!lastTelemetry) return prev;
            if (!lastSegment) {
                return [
                    {
                        isRunning: lastTelemetry.isRunning,
                        points: [
                            {
                                latitude: lastTelemetry.lat,
                                longitude: lastTelemetry.lng,
                            },
                        ],
                    },
                ];
            } else if (lastSegment.isRunning !== lastTelemetry.isRunning) {
                return [
                    ...prev,
                    {
                        isRunning: lastTelemetry.isRunning,
                        points: [
                            lastSegment.points.at(-1)!,
                            {
                                latitude: lastTelemetry.lat,
                                longitude: lastTelemetry.lng,
                            },
                        ],
                    },
                ];
            } else {
                return [
                    ...prev.slice(0, -1),
                    {
                        isRunning: lastTelemetry.isRunning,
                        points: [
                            ...lastSegment.points,
                            {
                                latitude: lastTelemetry.lat,
                                longitude: lastTelemetry.lng,
                            },
                        ],
                    },
                ];
            }
        });
    }, [status, mergedRecords, weight]);

    return {
        status,
        completedAt,
        setRunningStatus,
        userDashboardData,
        segments,
        runTime,
    };
}
