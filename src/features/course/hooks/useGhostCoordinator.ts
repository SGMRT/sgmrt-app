import { Telemetry } from "@/src/apis/types/run";
import { Segment } from "@/src/components/map/RunningLine";
import { findClosest } from "@/src/utils/interpolateTelemetries";
import { telemetriesToSegment } from "@/src/utils/runUtils";
import { useEffect, useMemo, useRef } from "react";
import Toast from "react-native-toast-message";
import { Controls } from "../../run/hooks/useRunningSession";
import { voiceGuide } from "../../voice/VoiceGuide";
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
    timestamp: number; // 상대 시간 (0ms ~ )
    controls: Controls;
}

export function useGhostCoordinator(
    props: GhostCoordinatorProps
): GhostCompareResult | null {
    const { legs, ghostTelemetry, myPoint, myLegIndex, timestamp, controls } =
        props;

    const ghostLegIndexRef = useRef(0);
    const prevTimestampRef = useRef<number | null>(null);

    // 리더 변경 감지용
    const prevLeaderRef = useRef<"ME" | "GHOST" | "TIED">("TIED");
    const lastAnnounceAtRef = useRef<number>(0); // 스팸 방지 (ms)

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

    // 1) 순수 계산만 수행 (사이드이펙트 금지)
    const result = useMemo<GhostCompareResult | null>(() => {
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
        prevTimestampRef.current = timestamp;

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
        const leader: "ME" | "GHOST" | "TIED" =
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
        ghostSegments,
        myLegIndex,
        ghostPoint,
        timestamp,
        ghostTelemetry.length,
    ]);

    // 2) 리더 변경 시 렌더 이후에 사이드이펙트 실행
    useEffect(() => {
        if (!result) return;

        const nowMs = Date.now();
        const leader = result.leader;
        const prev = prevLeaderRef.current;

        // 리더가 바뀌고 TIED가 아닐 때만, 2초 쿨다운
        if (
            leader !== "TIED" &&
            leader !== prev &&
            nowMs - lastAnnounceAtRef.current > 2000
        ) {
            prevLeaderRef.current = leader;
            lastAnnounceAtRef.current = nowMs;

            const absDelta = Math.abs(result.deltaM);
            const text =
                leader === "ME"
                    ? `고스트를 추월하였습니다. 거리 차이는 ${absDelta} 미터 입니다.`
                    : `고스트가 앞서고 있습니다. 거리 차이는 ${absDelta} 미터 입니다.`;

            // 모든 사이드이펙트를 렌더 이후로
            // (필요 시 requestAnimationFrame으로 한 프레임 더 미룸)
            controls.setLiveActivityMessage(text, "INFO");
            voiceGuide.announce({
                type: "run/ghost-change-leader",
                leader,
                deltaM: absDelta,
            });
            Toast.show({
                text1:
                    leader === "ME"
                        ? "고스트를 추월하였습니다"
                        : "고스트가 앞서고 있습니다",
                type: "info",
                position: "bottom",
                bottomOffset: 60,
                visibilityTime: 3000,
            });
        }
    }, [result, controls]);

    return result;
}
