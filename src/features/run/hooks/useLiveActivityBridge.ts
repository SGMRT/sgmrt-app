import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import expoLiveActivity from "../../../../modules/expo-live-activity";
import { RunContext } from "../context/context";
import { selectLiveActivityPayload } from "../context/selectors";
import { mapRunType } from "../utils/mapRunType";

// 전송 기준 (배터리 최적화: 백그라운드에서는 업데이트 주기 늘림)
const UPDATE_INTERVAL_FOREGROUND_MS = 1000;
const UPDATE_INTERVAL_BACKGROUND_MS = 5000;
// 스와이프 종료 후 자동 재시작 딜레이
const RESTART_DELAY_MS = 2500;
const MIN_DISTANCE_DELTA_M = 3;
const MIN_PACE_DELTA_S = 5;
const MIN_PROGRESS_DELTA = 0.01;

type Payload = ReturnType<typeof selectLiveActivityPayload>;

function changedEnough(prev?: Payload, next?: Payload) {
    if (!prev || !next) return false;

    if (prev.startedAtISO !== next.startedAtISO) return true;
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

export interface LiveActivityBridgeCallbacks {
    onWidgetPause?: () => void;
    onWidgetResume?: () => void;
    onWidgetComplete?: () => void;
}

export function useLiveActivityBridge(
    context: RunContext,
    callbacks?: LiveActivityBridgeCallbacks
) {
    const startedRef = useRef(false);
    const lastSentRef = useRef<{ ts: number; payload: Payload } | null>(null);
    const pendingRef = useRef<Payload | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevSessionIdRef = useRef<string | null>(null);
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 현재 상태를 ref로 유지 (setTimeout 콜백에서 최신 값 참조)
    const contextStatusRef = useRef(context.status);
    contextStatusRef.current = context.status;
    // context 전체를 ref로 유지 (리스너 콜백에서 최신 값 참조, 리스너 재등록 방지)
    const contextRef = useRef(context);
    contextRef.current = context;
    // 앱 상태 (배터리 최적화용)
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    // 백그라운드에서 스와이프 종료 감지 시 포그라운드 복귀 후 재시작 플래그
    const pendingRestartRef = useRef(false);

    // 공통 클린업 함수
    const cleanup = useCallback(() => {
        if (startedRef.current) {
            try {
                expoLiveActivity.endActivity();
            } catch {}
        }
        startedRef.current = false;
        lastSentRef.current = null;
        pendingRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
    }, []);

    // 세션 아이디 변경 감지 시 정리
    useEffect(() => {
        const cur = context.sessionId ?? null;
        const prev = prevSessionIdRef.current;
        if (prev && cur && prev !== cur) {
            // 세션이 바뀌면 이전 라이브 액티비티 종료 후 초기화
            cleanup();
        }
        prevSessionIdRef.current = cur;
    }, [context.sessionId, cleanup]);

    // IDLE/READY 진입 시에도 정리
    useEffect(() => {
        if (context.status === "IDLE" || context.status === "READY") {
            cleanup();
        }
    }, [context.status, cleanup]);

    const flush = useCallback(
        (payload: Payload, force = false) => {
            const now = Date.now();
            const last = lastSentRef.current;

            const forceEvent =
                !last ||
                !!payload.pausedAtISO !== !!last.payload.pausedAtISO ||
                payload.message !== last.payload.message ||
                payload.messageType !== last.payload.messageType ||
                payload.startedAtISO !== last.payload.startedAtISO;

            if (!startedRef.current) {
                try {
                    expoLiveActivity.endActivity();
                } catch {}
                if (!payload.startedAtISO) return;

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

            if (!force && !changedEnough(last?.payload, payload) && !forceEvent)
                return;

            // 배터리 최적화: 백그라운드에서는 업데이트 주기 늘림
            const minInterval =
                appStateRef.current === "active"
                    ? UPDATE_INTERVAL_FOREGROUND_MS
                    : UPDATE_INTERVAL_BACKGROUND_MS;

            const since = last ? now - last.ts : Infinity;
            if (!force && !forceEvent && since < minInterval) {
                pendingRef.current = payload;
                if (timerRef.current == null) {
                    const delay = minInterval - since;
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

            // 즉시 전송
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

    // AppState 변화 구독 (flush 선언 후에 위치해야 함)
    useEffect(() => {
        const sub = AppState.addEventListener("change", (nextState) => {
            const wasBackground = appStateRef.current !== "active";
            appStateRef.current = nextState;

            // 포그라운드 복귀 시 pending restart 처리
            if (nextState === "active" && wasBackground && pendingRestartRef.current) {
                pendingRestartRef.current = false;
                const status = contextStatusRef.current;
                if (status === "RUNNING" || status === "PAUSED_USER") {
                    startedRef.current = false;
                    const payload = selectLiveActivityPayload(contextRef.current);
                    flush(payload, true);
                }
            }
        });
        return () => sub.remove();
    }, [flush]);

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

    // Widget에서 보낸 액션 이벤트 구독
    useEffect(() => {
        const pauseSub = expoLiveActivity.addListener("onWidgetPause", () => {
            callbacks?.onWidgetPause?.();
        });

        const resumeSub = expoLiveActivity.addListener("onWidgetResume", () => {
            callbacks?.onWidgetResume?.();
        });

        const completeSub = expoLiveActivity.addListener(
            "onWidgetComplete",
            () => {
                callbacks?.onWidgetComplete?.();
            }
        );

        return () => {
            pauseSub.remove();
            resumeSub.remove();
            completeSub.remove();
        };
    }, [callbacks]);

    // Live Activity 스와이프 종료 감지 및 자동 재시작
    useEffect(() => {
        const dismissedSub = expoLiveActivity.addListener(
            "onLiveActivityDismissed",
            () => {
                // 이전 재시작 타이머가 있으면 취소
                if (restartTimerRef.current) {
                    clearTimeout(restartTimerRef.current);
                }

                // 러닝 중일 때만 재시작 스케줄
                const status = contextStatusRef.current;
                if (status === "RUNNING" || status === "PAUSED_USER") {
                    // 포그라운드에서는 바로 재시작, 백그라운드에서는 복귀 시 재시작
                    if (appStateRef.current === "active") {
                        restartTimerRef.current = setTimeout(() => {
                            restartTimerRef.current = null;

                            // 딜레이 후에도 여전히 러닝 중인지 확인
                            const currentStatus = contextStatusRef.current;
                            if (
                                currentStatus === "RUNNING" ||
                                currentStatus === "PAUSED_USER"
                            ) {
                                // Live Activity 재시작
                                startedRef.current = false;
                                const payload = selectLiveActivityPayload(contextRef.current);
                                flush(payload, true);
                            }
                        }, RESTART_DELAY_MS);
                    } else {
                        // 백그라운드: 포그라운드 복귀 시 재시작하도록 플래그 설정
                        pendingRestartRef.current = true;
                    }
                }
            }
        );

        const staleSub = expoLiveActivity.addListener(
            "onLiveActivityStale",
            () => {
                // stale 상태에서도 러닝 중이면 재시작
                const status = contextStatusRef.current;
                if (status === "RUNNING" || status === "PAUSED_USER") {
                    startedRef.current = false;
                    const payload = selectLiveActivityPayload(contextRef.current);
                    flush(payload, true);
                }
            }
        );

        return () => {
            dismissedSub.remove();
            staleSub.remove();
            if (restartTimerRef.current) {
                clearTimeout(restartTimerRef.current);
            }
        };
    }, [flush]);
}
