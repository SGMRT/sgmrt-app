// useRunAnalytics.ts
import { useAuthStore } from "@/src/store/authState";
import * as amplitude from "@amplitude/analytics-react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { RunContext } from "../context/context";
import { RunStatus } from "../types";
import { mapRunType } from "../utils/mapRunType";
import { trackAmplitude } from "@/src/utils/trackAmplitude";

export function useRunAnalytics(context: RunContext) {
    const { courseId, ghostRunningId } = useLocalSearchParams();
    const [isCourseFinished, setIsCourseFinished] = useState(false);
    const prevStatus = useRef<RunStatus | null>(null);
    const { uuid } = useAuthStore();

    const propsBase = {
        run_mode: mapRunType(context.mode, context.variant),
        session_id: context.sessionId,
        user_id: uuid,
        course_id: courseId
            ? courseId === "-1"
                ? undefined
                : courseId
            : undefined,
    };

    useEffect(() => {
        const prev = prevStatus.current;
        const curr = context.status;
        prevStatus.current = curr;

        // START: IDLE/READY -> RUNNING(또는 READY) 전이 시 한 번
        if (
            (prev === "IDLE" || prev == null) &&
            (curr === "RUNNING" || curr === "READY")
        ) {
            // run_start
            trackAmplitude("Run Started", propsBase);
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
            trackAmplitude("course_out", propsBase);
        }

        if (
            (prev === "PAUSED_OFFCOURSE" || prev === "PAUSED_USER") &&
            curr === "RUNNING"
        ) {
            trackAmplitude("run_restart", propsBase);
        }

        if (prev !== "COMPLETION_PENDING" && curr === "COMPLETION_PENDING") {
            // 완주/연장/정지
            setIsCourseFinished(true);
        }

        if (prev !== "STOPPED" && curr === "STOPPED") {
            // run_complete
            trackAmplitude("Run End", {
                ...propsBase,
                distance_km: (context.stats.totalDistanceM / 1000).toFixed(2),
                elevation_gain_m: context.stats.gainM.toFixed(2),
                course_finished:
                    propsBase.run_mode !== "SOLO"
                        ? isCourseFinished
                        : undefined,
            });
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
