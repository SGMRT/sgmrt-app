import expoLiveActivity from "@/modules/expo-live-activity";
import { useCallback, useEffect, useRef } from "react";
import { RunContext } from "../state/context";
import { selectLiveActivityPayload } from "../state/selectors";
import { mapRunType } from "../utils/mapRunType";

// 전송 기준
const UPDATE_MIN_INTERVAL_MS = 1000;
const MIN_DISTANCE_DELTA_M = 3;
const MIN_PACE_DELTA_S = 5;
const MIN_PROGRESS_DELTA = 0.01;

type Payload = ReturnType<typeof selectLiveActivityPayload>;

function changedEnough(prev?: Payload, next?: Payload) {
    if (!prev || !next) return false;

    if (!!prev.pausedAtISO !== !!next.pausedAtISO) return true;
    if (prev.message !== next.message || prev.messageType !== next.messageType)
        return true;

    if (
        Math.abs((prev.distanceMeters ?? 0) - (next.distanceMeters ?? 0)) >=
        MIN_DISTANCE_DELTA_M
    )
        return true;
    if (
        Math.abs((prev.recentPace ?? 0) - (next.recentPace ?? 0)) >=
        MIN_PACE_DELTA_S
    )
        return true;
    if (
        prev.progress != null &&
        next.progress != null &&
        Math.abs(prev.progress - next.progress) >= MIN_PROGRESS_DELTA
    )
        return true;

    return false;
}

export function useLiveActivityBridge(context: RunContext) {
    const startedRef = useRef(false);
    const lastSentRef = useRef<{ ts: number; payload: Payload } | null>(null);
    const pendingRef = useRef<Payload | null>(null);
    const timerRef = useRef<number | null>(null);

    const flush = useCallback(
        (payload: Payload, force = false) => {
            const now = Date.now();
            const last = lastSentRef.current;

            const forceEvent =
                !last ||
                !!payload.pausedAtISO !== !!last.payload.pausedAtISO ||
                payload.message !== last.payload.message ||
                payload.messageType !== last.payload.messageType;

            if (!startedRef.current) {
                expoLiveActivity.startActivity(
                    mapRunType(context.mode, context.variant),
                    context.sessionId!,
                    payload.startedAtISO,
                    payload.recentPace ?? 0,
                    payload.distanceMeters ?? 0,
                    payload.progress,
                    payload.message,
                    payload.messageType
                );
                startedRef.current = true;
                lastSentRef.current = { ts: now, payload };
                return;
            }

            if (!force && !changedEnough(last?.payload, payload)) return;

            const since = last ? now - last.ts : Infinity;
            if (!force && !forceEvent && since < UPDATE_MIN_INTERVAL_MS) {
                pendingRef.current = payload;
                if (timerRef.current == null) {
                    const delay = UPDATE_MIN_INTERVAL_MS - since;
                    timerRef.current = setTimeout(() => {
                        timerRef.current = null;
                        const toSend = pendingRef.current;
                        pendingRef.current = null;
                        if (!toSend) return;

                        if (
                            !changedEnough(lastSentRef.current?.payload, toSend)
                        )
                            return;
                        expoLiveActivity.updateActivity(
                            toSend.startedAtISO,
                            toSend.recentPace ?? 0,
                            toSend.distanceMeters ?? 0,
                            toSend.pausedAtISO,
                            toSend.progress,
                            toSend.message,
                            toSend.messageType
                        );
                        lastSentRef.current = {
                            ts: Date.now(),
                            payload: toSend,
                        };
                    }, delay);
                }
                return;
            }

            // 즉시 전송 (강제 이벤트 / 간격 충족)
            expoLiveActivity.updateActivity(
                payload.startedAtISO,
                payload.recentPace ?? 0,
                payload.distanceMeters ?? 0,
                payload.pausedAtISO,
                payload.progress,
                payload.message,
                payload.messageType
            );
            lastSentRef.current = { ts: now, payload };
        },
        [context.mode, context.variant, context.sessionId]
    );

    useEffect(() => {
        if (!context.sessionId) return;
        if (context.status === "STOPPED") {
            if (startedRef.current) expoLiveActivity.endActivity();
            startedRef.current = false;
            lastSentRef.current = null;
            pendingRef.current = null;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = null;
            return;
        }

        if (context.status === "IDLE" || context.status === "READY") return;

        const payload = selectLiveActivityPayload(context);
        flush(payload);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        context.sessionId,
        context.status, // 상태 전환
        context.telemetries.length, // 새 샘플(거리/페이스) 변화를 대표
        context.liveActivity.startedAtMs, // 시작/보정
        context.liveActivity.pausedAtMs, // 일시정지/재개
        context.mode,
        context.variant,
        flush,
    ]);
}
