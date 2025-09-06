import { MessageType } from "@/modules/expo-live-activity";
import { useEffect, useMemo, useReducer, useRef } from "react";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { RunAction } from "../state/actions";
import { initialRunContext, runReducer } from "../state/reducer";
import { joinedState } from "../store/joinedState";
import { RunMode } from "../types";
import { CourseMetadata, CourseVariant } from "../types/status";
import { anchoredBaroAlt } from "../utils/anchoredBaroAlt";
import { geoFilter } from "../utils/geoFilter";
import { useLiveActivityBridge } from "./useLiveActivityBridge";
import { useRunAnalytics } from "./useRunAnalytics";
import { useSensors } from "./useSensors";

export type Controls = ReturnType<typeof useRunningSession>["controls"];

export function useRunningSession() {
    const [context, dispatch] = useReducer(runReducer, initialRunContext);

    const sensorsEnabled =
        context.status !== "IDLE" && context.status !== "STOPPED";
    useSensors(sensorsEnabled);
    useRunAnalytics(context);

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
                courseMetadata?: CourseMetadata
            ) => {
                anchoredBaroAlt.reset();
                geoFilter.reset();

                dispatch({
                    type: "START",
                    payload: {
                        sessionId: uuidv4(),
                        mode,
                        variant,
                        courseMetadata,
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
                anchoredBaroAlt.reset();
                geoFilter.reset();
                dispatch({ type: "STOP" });
            },
            reset: () => {
                anchoredBaroAlt.reset();
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
