import {
    nowIso,
    pause,
    resume,
    start,
    startFlowSafely,
    stop,
} from "@/modules/expo-watch-module";
import { useEffect, useRef } from "react";
import { RunContext } from "../state/context";
import { RunStatus } from "../types";

export function useHeartRate(context: RunContext) {
    const prevStatus = useRef<RunStatus>("IDLE");
    const isWatchAvailable = useRef(true);
    const contextRef = useRef(context);

    useEffect(() => {
        contextRef.current = context;
    }, [context]);

    useEffect(() => {
        if (!isWatchAvailable.current) return;

        const prev = prevStatus.current;
        const curr = context.status;
        prevStatus.current = curr;
        const ts = nowIso();

        if ((prev === "IDLE" || prev === "READY") && curr === "RUNNING") {
            start()
                .then(() => {
                    startFlowSafely(ts);
                })
                .catch(() => {
                    isWatchAvailable.current = false;
                });
        } else if (curr === "RUNNING" || curr === "RUNNING_EXTENDED") {
            resume(ts);
        } else if (curr === "PAUSED_USER" || curr === "PAUSED_OFFCOURSE") {
            pause(ts);
        } else if (curr === "STOPPED") {
            try {
                stop(ts);
            } catch {
                isWatchAvailable.current = false;
            }
        }
    }, [context.status]);
}
