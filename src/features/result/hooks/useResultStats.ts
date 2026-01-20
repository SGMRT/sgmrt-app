import { SoloRunGetResponse } from "@/src/apis/types/run";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { useMemo } from "react";

export interface StatItem {
    description: string;
    value: string | number;
    unit?: string;
}

export function useResultStats(runData: SoloRunGetResponse | undefined) {
    const paceStats = useMemo<StatItem[]>(() => {
        return [
            {
                description: "거리",
                value: (runData?.recordInfo.distance ?? 0).toFixed(2),
                unit: "km",
            },
            {
                description: "평균",
                value: getFormattedPace(runData?.recordInfo.averagePace ?? 0),
            },
            {
                description: "최고",
                value: getFormattedPace(runData?.recordInfo.lowestPace ?? 0),
            },
            {
                description: "최저",
                value: getFormattedPace(runData?.recordInfo.highestPace ?? 0),
            },
        ];
    }, [runData]);

    const courseStats = useMemo<StatItem[]>(() => {
        return [
            {
                description: "전체 거리",
                value: (runData?.courseInfo?.distance ?? 0).toFixed(2),
                unit: "km",
            },
            {
                description: "상승 고도",
                value: runData?.recordInfo.elevationGain ?? 0,
                unit: "m",
            },
            {
                description: "하강 고도",
                value: Math.abs(runData?.recordInfo.elevationLoss ?? 0),
                unit: "m",
            },
        ];
    }, [runData]);

    const runningStats = useMemo<StatItem[]>(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    runData?.recordInfo.duration ?? 0,
                    "HH:MM:SS_IF_HH_EXISTS"
                ),
            },
            {
                description: "케이던스",
                value: runData?.recordInfo.cadence ?? 0,
                unit: "spm",
            },
            {
                description: "칼로리",
                value: runData?.recordInfo.calories ?? 0,
                unit: "kcal",
            },
        ];
    }, [runData]);

    const captureStats = useMemo<StatItem[]>(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    runData?.recordInfo.duration ?? 0,
                    "HH:MM:SS"
                ),
            },
            {
                description: "평균 페이스",
                value: getFormattedPace(runData?.recordInfo.averagePace ?? 0),
            },
            {
                description: "케이던스(spm)",
                value:
                    (runData?.recordInfo.cadence ?? 0) > 0
                        ? Math.round(runData?.recordInfo.cadence ?? 0)
                        : "--",
            },
            {
                description: "칼로리(kcal)",
                value: runData?.recordInfo.calories ?? 0,
            },
            {
                description: "평균 심박수",
                value: runData?.recordInfo.bpm ?? "--",
            },
            {
                description: "고도 상승",
                value:
                    (runData?.recordInfo.elevationGain ?? 0).toString() + "m",
            },
        ];
    }, [runData]);

    return {
        paceStats,
        courseStats,
        runningStats,
        captureStats,
    };
}
