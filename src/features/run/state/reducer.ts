import { Telemetry } from "@/src/apis/types/run";
import { RunStatus } from "../types";
import { RunAction } from "./actions";
import { RunContext } from "./context";
import { appendOne } from "./segments";
import { DEFAULT_STATS, updateStats } from "./stats";
import { buildTelemetry } from "./telemetry";

const initialContext: RunContext = {
    sessionId: null,
    mode: "SOLO",
    variant: undefined,
    status: "IDLE",
    mainTimeline: [],
    pausedBuffer: [],
    mutedBuffer: [],
    postCompleteBuffer: [],
    stats: DEFAULT_STATS,
    telemetries: [],
    segments: [],
    _zeroNextDt: false,
    liveActivity: {
        startedAtMs: null,
        pausedAtMs: null,
        message: null,
        messageType: null,
    },
};

export type RouteKey =
    | "mainTimeline"
    | "pausedBuffer"
    | "mutedBuffer"
    | "postCompleteBuffer"
    | "ignore";

export function routeKeyByStatus(status: RunStatus): RouteKey {
    switch (status) {
        case "RUNNING":
        case "RUNNING_EXTENDED":
            return "mainTimeline";
        case "PAUSED_USER":
            return "pausedBuffer";
        case "READY":
            return "mutedBuffer";
        case "PAUSED_OFFCOURSE":
            return "mutedBuffer";
        case "COMPLETION_PENDING":
            return "postCompleteBuffer";
        default:
            return "ignore";
    }
}

export function runReducer(
    state: RunContext = initialContext,
    action: RunAction
): RunContext {
    switch (action.type) {
        // 러닝 시작 (초기화)
        case "START": {
            const { sessionId, mode, variant } = action.payload;
            const now = Date.now();
            return {
                sessionId,
                mode,
                variant,
                status: mode === "COURSE" ? "READY" : "RUNNING",
                mainTimeline: [],
                pausedBuffer: [],
                mutedBuffer: [],
                postCompleteBuffer: [],
                stats: DEFAULT_STATS,
                telemetries: [],
                segments: [],
                _zeroNextDt: false,
                liveActivity: {
                    startedAtMs: mode === "COURSE" ? null : now,
                    pausedAtMs: null,
                    message: null,
                    messageType: null,
                },
            };
        }

        // 코스 러닝 대기 상태
        case "READY": {
            return {
                ...state,
                status: "READY",
            };
        }

        // 유저에 의한 일시정지
        case "PAUSE_USER":
        // 코스 이탈로 일시정지
        case "OFFCOURSE":
        // 완주 -> 보류 상태
        case "COMPLETE": {
            const now = Date.now();
            return {
                ...state,
                status:
                    action.type === "PAUSE_USER"
                        ? "PAUSED_USER"
                        : action.type === "OFFCOURSE"
                        ? "PAUSED_OFFCOURSE"
                        : "COMPLETION_PENDING",
                liveActivity: {
                    ...state.liveActivity,
                    pausedAtMs: state.liveActivity.pausedAtMs ?? now,
                },
            };
        }

        // 러닝 재개
        case "RESUME":
        case "ONCOURSE": {
            const now = Date.now();
            const pausedAt = state.liveActivity.pausedAtMs;
            const startedAt =
                pausedAt != null
                    ? (state.liveActivity.startedAtMs ?? now) + (now - pausedAt)
                    : state.liveActivity.startedAtMs ?? now;
            return {
                ...state,
                status: "RUNNING",
                mainTimeline: [...state.mainTimeline, ...state.pausedBuffer],
                pausedBuffer: [],
                mutedBuffer: [],
                _zeroNextDt: true,
                liveActivity: {
                    ...state.liveActivity,
                    startedAtMs: startedAt,
                    pausedAtMs: null,
                },
            };
        }

        // 완주 이후 계속 러닝 대기
        case "EXTEND": {
            const merged = state.postCompleteBuffer;
            let stats = state.stats;
            let zeroFlag = state._zeroNextDt; // 첫 샘플에만 zeroDt 적용
            const telemetries: Telemetry[] = [];
            let segments = state.segments.slice();

            let prevT = state.telemetries.at(-1);

            const now = Date.now();
            const pausedAt = state.liveActivity.pausedAtMs;
            const startedAt =
                pausedAt != null
                    ? (state.liveActivity.startedAtMs ?? now) + (now - pausedAt)
                    : state.liveActivity.startedAtMs ?? now;

            merged.forEach((sample, i) => {
                stats = updateStats(
                    stats,
                    sample,
                    zeroFlag ? { zeroDt: true } : undefined
                );
                zeroFlag = false;

                const t = buildTelemetry(
                    stats,
                    sample,
                    prevT,
                    /* isRunning */ true
                );
                telemetries.push(t);
                prevT = t;

                const idx = state.telemetries.length + telemetries.length - 1;
                segments = appendOne(segments, idx, true);
            });

            return {
                ...state,
                status: "RUNNING_EXTENDED",
                mainTimeline: [...state.mainTimeline, ...merged],
                postCompleteBuffer: [],
                stats,
                _zeroNextDt: false,
                telemetries: [...state.telemetries, ...telemetries],
                segments,
                liveActivity: {
                    ...state.liveActivity,
                    startedAtMs: startedAt,
                    pausedAtMs: null,
                },
            };
        }

        // 최종 종료
        case "STOP": {
            return {
                ...state,
                status: "STOPPED",
            };
        }

        // 초기화
        case "RESET": {
            return initialContext;
        }

        // 샘플 받아서 버퍼에 추가
        case "ACCEPT_SAMPLE": {
            const key = routeKeyByStatus(state.status);
            if (key === "ignore") return state;

            const { sample } = action.payload;

            const runningFlag =
                key === "mainTimeline" || key === "postCompleteBuffer";

            if (key === "mainTimeline") {
                const mainTimeline = [...state.mainTimeline, sample];
                const stats = updateStats(
                    state.stats,
                    sample,
                    state._zeroNextDt ? { zeroDt: true } : undefined
                );

                const telemetry = buildTelemetry(
                    stats,
                    sample,
                    state.telemetries.at(-1),
                    runningFlag
                );

                const telemetries = [...state.telemetries, telemetry];
                const idx = telemetries.length - 1;

                return {
                    ...state,
                    mainTimeline,
                    stats,
                    _zeroNextDt: false,
                    telemetries,
                    segments: appendOne(state.segments, idx, runningFlag),
                };
            }

            if (key === "pausedBuffer") {
                const telemetry = buildTelemetry(
                    state.stats,
                    sample,
                    state.telemetries.at(-1),
                    runningFlag
                );
                const telemetries = [...state.telemetries, telemetry];
                const idx = telemetries.length - 1;

                return {
                    ...state,
                    pausedBuffer: [...state.pausedBuffer, sample],
                    telemetries,
                    segments: appendOne(state.segments, idx, runningFlag),
                };
            }
            if (key === "mutedBuffer") {
                return {
                    ...state,
                    mutedBuffer: [...state.mutedBuffer, sample],
                };
            }
            if (key === "postCompleteBuffer") {
                return {
                    ...state,
                    postCompleteBuffer: [...state.postCompleteBuffer, sample],
                };
            }
        }

        case "SET_LIVE_ACTIVITY_MESSAGE": {
            return {
                ...state,
                liveActivity: { ...state.liveActivity, ...action.payload },
            };
        }

        default:
            return state;
    }
}

export const initialRunContext = initialContext;
