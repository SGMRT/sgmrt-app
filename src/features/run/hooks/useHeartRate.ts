import {
    nowIso,
    pause,
    resume,
    start,
    startWorkout,
    stop,
} from "@/modules/expo-watch-module";
import { captureError, ERROR_PRIORITY } from "@/src/utils/sentryTools";
import { useEffect, useRef } from "react";
import { RunContext } from "../context/context";
import { RunStatus } from "../types";

export function useHeartRate(context: RunContext) {
    const prevStatus = useRef<RunStatus>("IDLE");
    const isWatchAvailable = useRef(true);

    useEffect(() => {
        if (!isWatchAvailable.current) return;

        const prev = prevStatus.current;
        const curr = context.status;
        prevStatus.current = curr;

        const ts = nowIso();

        // 워치 네이티브 호출은 실패 시 reject하는 async 함수다.
        // await/catch 없이 호출하면 unhandled rejection이 되고(REACT-NATIVE-53),
        // beforeSend가 where 태그 없는 이벤트를 드롭하므로 원인 파악도 불가능하다.
        // 모든 호출의 reject를 명시적으로 잡아 captureError로 포집한다.
        const onFailure =
            (op: string, disableWatch: boolean) => (e: unknown) => {
                if (disableWatch) isWatchAvailable.current = false;
                captureError(
                    `watch.${op}`,
                    e,
                    { status: curr },
                    { where: "watch" },
                    ERROR_PRIORITY.MEDIUM
                );
            };

        if ((prev === "IDLE" || prev === "READY") && curr === "RUNNING") {
            // start 실패 시 워치를 비활성화해 이후 호출을 막는다
            start()
                .then(() => startWorkout("running", ts))
                .catch(onFailure("start", true));
        } else if (curr === "RUNNING" || curr === "RUNNING_EXTENDED") {
            // pause/resume 실패는 일시적일 수 있으므로 비활성화하지 않고 복구 여지를 남긴다
            resume(ts).catch(onFailure("resume", false));
        } else if (curr === "PAUSED_USER" || curr === "PAUSED_OFFCOURSE") {
            pause(ts).catch(onFailure("pause", false));
        } else if (curr === "STOPPED") {
            stop(ts).catch(onFailure("stop", false));
        }
    }, [context.status]);
}
