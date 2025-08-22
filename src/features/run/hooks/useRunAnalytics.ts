// useRunAnalytics.ts
import * as amplitude from "@amplitude/analytics-react-native";
import { useEffect, useRef } from "react";
import { RunContext } from "../state/context";
import { RunStatus } from "../types";
import { mapRunType } from "../utils/mapRunType";

export function useRunAnalytics(context: RunContext) {
    const prevStatus = useRef<RunStatus | null>(null);

    useEffect(() => {
        const prev = prevStatus.current;
        const curr = context.status;
        prevStatus.current = curr;

        const propsBase = {
            sessionId: context.sessionId,
            mode: mapRunType(context.mode, context.variant),
            distance: context.stats.totalDistanceM,
            elevationGain: context.stats.gainM,
        };

        // START: IDLE/READY -> RUNNING(또는 READY) 전이 시 한 번
        if (
            (prev === "IDLE" || prev == null) &&
            (curr === "RUNNING" || curr === "READY")
        ) {
            amplitude.track("Run Started", propsBase);
        }

        // // 일시정지/재개
        // if (prev === "RUNNING" && curr === "PAUSED_USER") {
        //     amplitude.track("Run Pause", propsBase);
        // }
        // if (prev === "PAUSED_USER" && curr === "RUNNING") {
        //     amplitude.track("Run Resume", propsBase);
        // }

        // 코스 이탈/복귀
        if (prev !== "PAUSED_OFFCOURSE" && curr === "PAUSED_OFFCOURSE") {
            amplitude.track("Course Offcourse", propsBase);
        }
        if (prev === "PAUSED_OFFCOURSE" && curr === "RUNNING") {
            amplitude.track("Course Oncourse", propsBase);
        }

        // 완주/연장/정지
        if (prev !== "COMPLETION_PENDING" && curr === "COMPLETION_PENDING") {
            amplitude.track("Course Complete", propsBase);
        }
        if (prev === "COMPLETION_PENDING" && curr === "RUNNING_EXTENDED") {
            amplitude.track("Course Extend", propsBase);
        }
        if (prev !== "STOPPED" && curr === "STOPPED") {
            amplitude.track("Run End", propsBase);
        }
    }, [
        context.status,
        context.sessionId,
        context.mode,
        context.variant,
        context.stats.totalDistanceM,
        context.stats.gainM,
    ]);
}
