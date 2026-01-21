import { MessageType } from "@/modules/expo-live-activity";
import { useLocalPrefs } from "@/src/store/localPrefs";
import { useEffect, useMemo, useReducer, useRef } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { useRunMetronome } from "../../audio/useRunMetronome";
import { RunAction } from "../context/actions";
import { initialRunContext, runReducer } from "../context/reducer";
import { joinedState } from "../store/joinedState";
import { RunMode } from "../types";
import { CourseMetadata, CourseVariant } from "../types/status";
import { geoFilter } from "../utils/geoFilter";
import { useHeartRate } from "./useHeartRate";
import { useLiveActivityBridge } from "./useLiveActivityBridge";
import { useRunAnalytics } from "./useRunAnalytics";
import { useSensors } from "./useSensors";

export type Controls = ReturnType<typeof useRunningSession>["controls"];

export function useRunningSession() {
    const [context, dispatch] = useReducer(runReducer, initialRunContext);

    const sensorsEnabled =
        context.status !== "IDLE" && context.status !== "STOPPED";
    useHeartRate(context);
    useSensors(sensorsEnabled);
    useRunAnalytics(context);

    const isCadenceAssistEnabled = useLocalPrefs((s) => s.cadenceAssistEnabled);
    const cadenceTarget = useLocalPrefs((s) => s.cadenceTarget);

    useRunMetronome({
        enabled:
            isCadenceAssistEnabled &&
            (context.status === "RUNNING" ||
                context.status === "RUNNING_EXTENDED"),
        baseBpm: cadenceTarget,
        deltaM: 0,
    });

    const unsubRef = useRef<null | (() => void)>(null);

    useEffect(() => {
        if (!sensorsEnabled) return;
        unsubRef.current?.();
        unsubRef.current = joinedState.subscribe((state) => {
            const action: RunAction = {
                type: "ACCEPT_SAMPLE",
                payload: { sample: state },
            };
            dispatch(action);
        });

        return () => {
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [sensorsEnabled]);

    const controls = useMemo(() => {
        return {
            start: (
                mode: RunMode,
                variant?: CourseVariant,
                courseMetadata?: CourseMetadata,
                /** 사용자 체중 (kg), 칼로리 계산에 사용 */
                userWeight?: number
            ) => {
                geoFilter.reset();

                dispatch({
                    type: "START",
                    payload: {
                        sessionId: uuidv4(),
                        mode,
                        variant,
                        courseMetadata,
                        userWeight,
                    },
                });
            },
            ready: () => {
                dispatch({ type: "READY" });
            },
            pauseUser: () => {
                dispatch({ type: "PAUSE_USER" });
            },
            offcourse: () => {
                dispatch({ type: "OFFCOURSE" });
            },
            oncourse: () => {
                dispatch({ type: "ONCOURSE" });
            },
            resume: () => {
                dispatch({ type: "RESUME" });
            },
            complete: () => {
                dispatch({ type: "COMPLETE" });
            },
            extend: () => {
                dispatch({ type: "EXTEND" });
            },
            stop: () => {
                geoFilter.reset();
                dispatch({ type: "STOP" });
            },
            reset: () => {
                geoFilter.reset();
                dispatch({ type: "RESET" });
            },
            setLiveActivityMessage: (
                message: string | null,
                messageType: MessageType | null
            ) => {
                dispatch({
                    type: "SET_LIVE_ACTIVITY_MESSAGE",
                    payload: { message, messageType },
                });
            },
        };
    }, [dispatch]);

    useLiveActivityBridge(context);

    return { context, controls };
}
