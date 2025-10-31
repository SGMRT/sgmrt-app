import { devLog } from "@/src/utils/devLog";
import { useEffect, useRef } from "react";
import { RunContext } from "../run/state/context";
import { voice } from "./voice";

export function useRunVoice(context: RunContext) {
    const prevStatus = useRef(context.status);
    const lastKmSpokenRef = useRef(0);

    useEffect(() => {
        const currentKm = Math.floor(context.stats.totalDistanceM / 1000);

        if (currentKm > 0 && currentKm > lastKmSpokenRef.current) {
            lastKmSpokenRef.current = currentKm;
            voice.dispatch({
                type: "run/distance",
                distanceKM: String(currentKm),
                totalTime: Math.round(context.stats.totalTimeMs / 1000),
                totalCalories: context.stats.calories,
                avgPace: context.stats.avgPaceSecPerKm,
            });
        }
    }, [
        context.stats.totalDistanceM,
        context.stats.totalTimeMs,
        context.stats.calories,
        context.stats.avgPaceSecPerKm,
    ]);

    useEffect(() => {
        const prev = prevStatus.current;
        const curr = context.status;

        if (prev !== curr) {
            devLog("useRunVoice", prev, curr);
            switch (curr) {
                case "RUNNING": {
                    if (prev === "IDLE" || prev == null || prev === "READY") {
                        voice.dispatch({
                            type: "run/start",
                            mode: context.mode,
                        });
                    }
                    if (prev === "PAUSED_OFFCOURSE" || prev === "PAUSED_USER") {
                        voice.dispatch({ type: "run/resume" });
                    }
                    break;
                }
                case "RUNNING_EXTENDED":
                    voice.dispatch({ type: "run/extend" });
                    break;
                case "PAUSED_USER":
                    voice.dispatch({ type: "run/pause", reason: "user" });
                    break;
                case "PAUSED_OFFCOURSE":
                    voice.dispatch({
                        type: "run/pause",
                        reason: "offcourse",
                    });
                    break;
                case "COMPLETION_PENDING":
                    voice.dispatch({
                        type: "run/complete",
                        totalTime: Math.round(context.stats.totalTimeMs / 1000),
                        totalDistance: context.stats.totalDistanceM,
                        totalCalories: context.stats.calories,
                        avgPace: context.stats.avgPaceSecPerKm,
                    });
                    voice.clearQueue();
                    break;
                case "STOPPED":
                    if (prevStatus.current === "COMPLETION_PENDING") return;
                    voice.dispatch({
                        type: "run/stop",
                        totalTime: Math.round(context.stats.totalTimeMs / 1000),
                        totalDistance: context.stats.totalDistanceM,
                        totalCalories: context.stats.calories,
                        avgPace: context.stats.avgPaceSecPerKm,
                    });
                    voice.clearQueue();
                    break;
            }
            prevStatus.current = curr;
        }
    }, [
        context.status,
        context.stats.totalTimeMs,
        context.stats.totalDistanceM,
        context.stats.calories,
        context.stats.avgPaceSecPerKm,
        context.mode,
    ]);
}
