import { useEffect, useMemo, useReducer, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { RunAction } from "../state/actions";
import { initialRunContext, runReducer } from "../state/reducer";
import { joinedState } from "../store/joinedState";
import { RunMode } from "../types";
import { CourseVariant } from "../types/status";
import { anchoredBaroAlt } from "../utils/anchoredBaroAlt";
import { geoFilter } from "../utils/geoFilter";
import { useLiveActivityBridge } from "./useLiveActivityBridge";
import { useSensors } from "./useSensors";

export function useRunningSession() {
    const [context, dispatch] = useReducer(runReducer, initialRunContext);

    const sensorsEnabled =
        context.status !== "IDLE" && context.status !== "STOPPED";
    useSensors(sensorsEnabled);

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
            start: (mode: RunMode, variant?: CourseVariant) => {
                anchoredBaroAlt.reset();
                geoFilter.reset();
                dispatch({
                    type: "START",
                    payload: { sessionId: uuidv4(), mode, variant },
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
        };
    }, [dispatch]);

    useLiveActivityBridge(context);
    return { context, controls };
}
