import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";
import {
    getCadence,
    getCalories,
    getPace,
    telemetriesToSegment,
} from "../utils/runUtils";
import useRunningSensors, { MergedRecord } from "./sensors/useRunningSensors";

interface RunningProps {
    type: "free" | "course";
    weight: number;
    course?: Telemetry[];
}

export type RunningStatus =
    | "before_running"
    | "before_course_running"
    | "course_running"
    | "free_running"
    | "paused"
    | "stopped"
    | "completed"
    | "cancel_course_running";

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

export default function useRunning({ type, weight, course }: RunningProps) {
    const { mergedRecords, courseIndex } = useRunningSensors({
        intervalMs: 1000,
        course,
    });

    const [completedAt, setCompletedAt] = useState<number | null>(null);
    const [courseRunTime, setCourseRunTime] = useState<number | null>(null);
    const courseStepCountRef = useRef<number>(0);
    const courseDashboardDataRef = useRef<UserDashBoardData>({
        totalDistance: 0,
        paceOfLastPoints: 0,
        cadenceOfLastPoints: 0,
        totalCalories: 0,
        totalElevationGain: 0,
        totalElevationLoss: 0,
        bpm: 0,
    });

    const [status, setStatus] = useState<RunningStatus>("before_running");

    const activeRef = useRef<number | null>(null);
    const baseAltitudeRef = useRef<number | null>(null);
    const totalStepCountRef = useRef<number>(0);
    const courseIndexRef = useRef<number>(0);

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

    const alertRef = useRef<number>(0);

    const setRunningStatus = useCallback(
        (status: RunningStatus) => {
            if (status === "course_running" || status === "free_running") {
                activeRef.current = Date.now();
            } else if (status === "completed") {
                setCompletedAt(Date.now());
                setCourseRunTime(runTimeRef.current);
                courseStepCountRef.current = totalStepCountRef.current;
                courseDashboardDataRef.current = userDashboardData;
            } else if (status === "cancel_course_running") {
                setCourseRunTime(-1);
            }
            setStatus(status);
        },
        [userDashboardData]
    );

    useEffect(() => {
        if (status === "stopped") {
            let type = 0;
            let time = 0;
            alertRef.current = setInterval(() => {
                if (time >= 10 * 60 * 1000) {
                    clearInterval(alertRef.current);
                    router.replace(`/(tabs)/home`);
                    return;
                }
                Toast.show({
                    type: "info",
                    text1:
                        type === 0
                            ? "코스를 이탈하였습니다"
                            : "10분 뒤 자동 종료됩니다",
                    position: "bottom",
                    bottomOffset: 60,
                });
                type = type === 0 ? 1 : 0;
                time += 4000;
            }, 4000);
        } else {
            clearInterval(alertRef.current);
        }
    }, [status]);

    useEffect(() => {
        if (
            !course ||
            status === "free_running" ||
            status === "completed" ||
            status === "paused" ||
            status === "cancel_course_running"
        )
            return;
        if (status === "before_running") {
            if (courseIndex >= 0 && courseIndex <= 1) {
                setRunningStatus("before_course_running");
            }
        } else if (status === "course_running") {
            if (courseIndex === -1) {
                setRunningStatus("stopped");
            } else if (courseIndex === course.length - 1) {
                setRunningStatus("completed");
                courseIndexRef.current = courseIndex;
            } else {
                courseIndexRef.current = courseIndex;
            }
        } else if (status === "stopped") {
            if (
                courseIndex >= courseIndexRef.current - 1 &&
                courseIndex <= courseIndexRef.current + 1
            ) {
                setRunningStatus("course_running");
                courseIndexRef.current = courseIndex;
            }
        }
    }, [courseIndex, course, setRunningStatus, status]);

    useEffect(() => {
        const currentRecord = mergedRecords.at(-1);
        if (currentRecord === undefined) return;
        const deltaDistanceM = Number(currentRecord.deltaDistanceM.toFixed(2));
        const deltaStep = currentRecord.deltaStep;
        if (
            status === "before_running" ||
            status === "stopped" ||
            status === "before_course_running"
        ) {
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
            totalStepCountRef.current += currentRecord.deltaStep;
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

            const elevationDiffs = telemetryRef.current.map(
                (telemetry, index) => {
                    if (index === 0) return 0;
                    return (
                        telemetry.alt - telemetryRef.current.at(index - 1)!.alt
                    );
                }
            );

            setUserDashboardData({
                totalDistance: lastTelemetry?.dist ?? 0,
                paceOfLastPoints: lastTelemetry?.pace ?? 0,
                cadenceOfLastPoints: lastTelemetry?.cadence ?? 0,
                totalCalories: getCalories({
                    distance: lastTelemetry?.dist ?? 0,
                    timeInSec: runTimeRef.current,
                    weight: weight,
                }),
                totalElevationGain: elevationDiffs.reduce((acc, diff) => {
                    if (diff > 0) {
                        return acc + diff;
                    }
                    return acc;
                }, 0),
                totalElevationLoss: elevationDiffs.reduce((acc, diff) => {
                    if (diff < 0) {
                        return acc + diff;
                    }
                    return acc;
                }, 0),
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

    const showSegment = useCallback(() => {
        if (!course) return segments;
        if (
            (type === "course" && !completedAt && courseRunTime !== -1) ||
            status === "completed"
        ) {
            return telemetriesToSegment(course, courseIndexRef.current);
        } else {
            return segments;
        }
    }, [course, completedAt, status, segments, type, courseRunTime]);

    const getCourseCompletedTelemetries = useCallback(() => {
        if (!course) return telemetryRef.current;
        if (status === "completed" && courseRunTime && completedAt) {
            return telemetryRef.current.filter(
                (telemetry) => telemetry.timeStamp <= completedAt!
            );
        }
        return telemetryRef.current;
    }, [course, status, courseRunTime, completedAt]);

    return {
        status,
        completedAt,
        setRunningStatus,
        userDashboardData,
        segments: showSegment(),
        telemetries: telemetryRef.current,
        courseCompletedTelemetries: getCourseCompletedTelemetries(),
        runTime,
        courseRunTime,
        totalStepCount: totalStepCountRef.current,
        courseIndex: courseIndexRef.current,
        courseStepCount: courseStepCountRef.current,
        courseDashboardData: courseDashboardDataRef.current,
    };
}
