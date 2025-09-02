import { useEffect, useRef } from "react";
import { RunContext } from "../run/state/context";
import { voiceGuide } from "./VoiceGuide";

export function useRunVoice(context: RunContext) {
    const prevStatus = useRef(context.status);

    useEffect(() => {
        const prev = prevStatus.current;
        const curr = context.status;

        if (prev !== curr) {
            console.log("useRunVoice", prev, curr);
            switch (curr) {
                case "RUNNING": {
                    if (prev === "IDLE" || prev == null || prev === "READY") {
                        voiceGuide.announce({
                            type: "run/start",
                            mode: context.mode,
                        });
                    }
                    if (prev === "PAUSED_OFFCOURSE" || prev === "PAUSED_USER") {
                        voiceGuide.announce({ type: "run/resume" });
                    }
                    break;
                }
                case "RUNNING_EXTENDED":
                    voiceGuide.announce({ type: "run/extend" });
                    break;
                case "PAUSED_USER":
                    voiceGuide.announce({ type: "run/pause", reason: "user" });
                    break;
                case "PAUSED_OFFCOURSE":
                    voiceGuide.announce({
                        type: "run/pause",
                        reason: "offcourse",
                    });
                    break;
                case "COMPLETION_PENDING":
                    voiceGuide.announce({
                        type: "run/complete",
                        totalTime: context.stats.totalTimeMs,
                        totalDistance: context.stats.totalDistanceM,
                        totalCalories: context.stats.calories,
                        avgPace: context.stats.avgPaceSecPerKm,
                    });
                    break;
                case "STOPPED":
                    voiceGuide.announce({
                        type: "run/stop",
                        totalTime: Math.round(context.stats.totalTimeMs / 1000),
                        totalDistance: context.stats.totalDistanceM,
                        totalCalories: context.stats.calories,
                        avgPace: context.stats.avgPaceSecPerKm,
                    });
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
