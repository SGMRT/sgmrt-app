import { Telemetry } from "@/src/apis/types/run";
import { Segment } from "@/src/components/map/RunningLine";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import { findClosest } from "@/src/utils/interpolateTelemetries";
import { telemetriesToSegment } from "@/src/utils/runUtils";
import { useEffect, useMemo, useRef } from "react";
import { InteractionManager } from "react-native"; // ✅ 추가
import { voiceGuide } from "../../audio/VoiceGuide";
import { Controls } from "../../run/hooks/useRunningSession";
import { CourseLeg } from "../types/courseLeg";
import {
    nearestDistanceToPolylineM,
    progressAlongCourseM,
    remainingAlongLegM,
} from "../utils/courseGeometry";

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
    timestamp: number;
    controls: Controls;
    simulateSpeed?: number;
}

export function useGhostCoordinator(
    props: GhostCoordinatorProps
): GhostCompareResult | null {
    const {
        legs,
        ghostTelemetry,
        myPoint,
        myLegIndex,
        timestamp,
        controls,
        simulateSpeed,
    } = props;

    const ghostLegIndexRef = useRef(0);
    const prevTimestampRef = useRef<number | null>(null);
    const prevLeaderRef = useRef<"ME" | "GHOST" | "TIED">("TIED");

    const ghostPoint = findClosest(
        ghostTelemetry,
        timestamp * (simulateSpeed ?? 1),
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

    // 1) 계산만 하는 단계 (사이드이펙트 금지)
    const result = useMemo<GhostCompareResult | null>(() => {
        if (
            !legs.length ||
            !myPoint ||
            !ghostPoint ||
            ghostTelemetry.length === 0
        )
            return null;

        if (
            prevTimestampRef.current !== null &&
            prevTimestampRef.current === timestamp
        )
            return null;
        prevTimestampRef.current = timestamp;

        const myProgressM = progressAlongCourseM(legs, myLegIndex, myPoint);

        // 후보 window
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
        if (!Number.isFinite(best.perp) || best.perp > 1000) {
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

        const deltaM = Math.round(ghostProgressM - myProgressM);
        const leader =
            Math.abs(deltaM) < 5 ? "TIED" : deltaM > 0 ? "GHOST" : "ME";

        const ghostStat = {
            distance: ghostPoint.dist,
            cadence: ghostPoint.cadence,
            pace: ghostPoint.pace,
        };

        return {
            ghostPoint,
            ghostSegments,
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
        ghostPoint,
        ghostTelemetry.length,
        myLegIndex,
        timestamp,
        ghostSegments,
    ]);

    // 2) 사이드 이펙트는 커밋 이후에만 실행
    useEffect(() => {
        if (!result) return;

        const { leader, deltaM } = result;
        if (leader === "TIED") return;
        if (leader === prevLeaderRef.current) return;

        prevLeaderRef.current = leader;

        const text =
            leader === "ME"
                ? `고스트를 추월하였습니다. 거리 차이는 ${Math.abs(
                      deltaM
                  )} 미터 입니다.`
                : `고스트가 앞서고 있습니다. 거리 차이는 ${Math.abs(
                      deltaM
                  )} 미터 입니다.`;

        // 네이티브/전역 업데이트
        controls.setLiveActivityMessage(text, "INFO");
        voiceGuide.announce({
            type: "run/ghost-change-leader",
            leader,
            deltaM: Math.abs(deltaM),
        });

        // Toast는 커밋 이후로 안전하게 예약
        InteractionManager.runAfterInteractions(() => {
            showCompactToast(
                leader === "ME"
                    ? "고스트를 추월하였습니다"
                    : "고스트가 앞서고 있습니다"
            );
        });
    }, [result, controls]);

    return result;
}
