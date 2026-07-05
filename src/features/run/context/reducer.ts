import { Telemetry } from "@/src/apis/types/run";
import { RunStatus } from "../types";
import { RunAction } from "./actions";
import { RunContext } from "./context";
import { appendOne } from "./segments";
import { DEFAULT_STATS, updateStats } from "./stats";
import { buildTelemetry } from "./telemetry";

const DEFAULT_USER_WEIGHT = 70;

const initialContext: RunContext = {
    sessionId: null,
    mode: "SOLO",
    variant: undefined,
    courseMetadata: undefined,
    status: "IDLE",
    userWeight: DEFAULT_USER_WEIGHT,
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
            const { sessionId, mode, variant, courseMetadata, userWeight } =
                action.payload;
            const now = Date.now();
            return {
                sessionId,
                mode,
                variant,
                courseMetadata,
                status: mode === "COURSE" ? "READY" : "RUNNING",
                userWeight: userWeight ?? DEFAULT_USER_WEIGHT,
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
        // COMPLETION_PENDING 구간은 일시정지와 동일하게 취급:
        // 대기 중 시간/거리는 stats에 합산하지 않고 (화면 타이머와 일관성),
        // 트랙 연속성을 위해 텔레메트리만 isRunning=false로 기록
        case "EXTEND": {
            const merged = state.postCompleteBuffer;
            const telemetries: Telemetry[] = [];
            let segments = state.segments.slice();

            let prevT = state.telemetries.at(-1);

            const now = Date.now();
            const pausedAt = state.liveActivity.pausedAtMs;
            const startedAt =
                pausedAt != null
                    ? (state.liveActivity.startedAtMs ?? now) + (now - pausedAt)
                    : state.liveActivity.startedAtMs ?? now;

            merged.forEach((sample) => {
                const t = buildTelemetry(
                    state.stats,
                    sample,
                    prevT,
                    /* isRunning */ false
                );
                telemetries.push(t);
                prevT = t;

                const idx = state.telemetries.length + telemetries.length - 1;
                segments = appendOne(segments, idx, false);
            });

            return {
                ...state,
                status: "RUNNING_EXTENDED",
                mainTimeline: [...state.mainTimeline, ...merged],
                postCompleteBuffer: [],
                _zeroNextDt: true,
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
                const stats = updateStats(state.stats, sample, {
                    zeroDt: state._zeroNextDt,
                    weight: state.userWeight,
                });

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
