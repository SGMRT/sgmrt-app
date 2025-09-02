import { Telemetry } from "@/src/apis/types/run";
import { Segment } from "@/src/components/map/RunningLine";
import { findClosest } from "@/src/utils/interpolateTelemetries";
import { telemetriesToSegment } from "@/src/utils/runUtils";
import { useMemo, useRef } from "react";
import {
    nearestDistanceToPolylineM,
    progressAlongCourseM,
    remainingAlongLegM,
} from "../utils/courseGemoetry";
import { CourseLeg } from "./useCourseProgress";

type GhostCompareResult = {
    ghostPoint: Telemetry;
    ghostSegments: Segment[];
    ghostStats: {
        distance: number;
        cadence: number;
        pace: number;
    };
    myProgressM: number;
    ghostProgressM: number;
    deltaM: number;
    leader: "ME" | "GHOST" | "TIED";
    myLegIndex: number;
    ghostLegIndex: number;
};

interface GhostCoordinatorProps {
    legs: CourseLeg[];
    ghostTelemetry: Telemetry[];
    myPoint: Telemetry;
    myLegIndex: number;
    timestamp: number; // 상대 시간 (0초 ~ )
}

export function useGhostCoordinator(
    props: GhostCoordinatorProps
): GhostCompareResult | null {
    const { legs, ghostTelemetry, myPoint, myLegIndex, timestamp } = props;
    const ghostLegIndexRef = useRef(0);
    const prevTimestampRef = useRef(null);

    const ghostPoint = findClosest(
        ghostTelemetry,
        timestamp,
        (t) => t.timeStamp
    );

    const ghostSegments = useMemo(() => {
        return telemetriesToSegment(
            ghostTelemetry,
            ghostTelemetry.findIndex(
                (t) => t.timeStamp === ghostPoint?.timeStamp
            )
        );
    }, [ghostTelemetry, ghostPoint]);

    return useMemo(() => {
        if (
            !legs.length ||
            myPoint == null ||
            ghostPoint == null ||
            ghostTelemetry.length === 0
        )
            return null;

        if (
            prevTimestampRef.current !== null &&
            prevTimestampRef.current === timestamp
        )
            return null;

        const myProgressM = progressAlongCourseM(legs, myLegIndex, myPoint);

        // 후보 window 수집
        const startIdx = ghostLegIndexRef.current;
        const candidateIdxs = [startIdx, startIdx + 1, startIdx + 2].filter(
            (idx) => idx >= 0 && idx < legs.length
        );
        if (candidateIdxs.length === 0) candidateIdxs.push(0);

        const scored = candidateIdxs
            .map((idx) => {
                const perp = nearestDistanceToPolylineM(
                    legs[idx].points,
                    ghostPoint
                );
                const remainM = remainingAlongLegM(
                    legs[idx].points,
                    ghostPoint
                );
                return { idx, perp, remainM };
            })
            .sort((a, b) => a.perp - b.perp || a.remainM - b.remainM);

        let best = scored[0];
        if (!Number.isFinite(best.perp) || best.perp > 1000 /* 비정상치 */) {
            const all = legs
                .map((leg) => {
                    const perp = nearestDistanceToPolylineM(
                        leg.points,
                        ghostPoint
                    );
                    const remainM = remainingAlongLegM(leg.points, ghostPoint);
                    return { idx: leg.index, perp, remainM };
                })
                .sort((a, b) => a.perp - b.perp || a.remainM - b.remainM);
            best = all[0];
        }

        const pickedLeg = Math.max(ghostLegIndexRef.current, best.idx);
        ghostLegIndexRef.current = pickedLeg;

        const ghostProgressM = progressAlongCourseM(
            legs,
            pickedLeg,
            ghostPoint
        );

        const deltaM = ghostProgressM - myProgressM;
        const leader =
            Math.abs(deltaM) < 5 ? "TIED" : deltaM > 0 ? "GHOST" : "ME";

        const ghostStat = {
            distance: ghostPoint.dist,
            cadence: ghostPoint.cadence,
            pace: ghostPoint.pace,
        };

        return {
            ghostPoint: ghostPoint,
            ghostSegments: ghostSegments,
            ghostStats: ghostStat,
            myProgressM,
            ghostProgressM,
            deltaM,
            leader,
            myLegIndex,
            ghostLegIndex: pickedLeg,
        };
    }, [
        legs,
        myPoint,
        ghostSegments,
        myLegIndex,
        ghostPoint,
        timestamp,
        ghostTelemetry.length,
    ]);
}
