// modules/expo-watch-module/index.ts
import {
    EventEmitter,
    EventSubscription,
    NativeModule,
    requireNativeModule,
} from "expo-modules-core";

// 1) 상태 페이로드 정의
export type WatchStatePayload = {
    state:
        | "idle"
        | "ready"
        | "started"
        | "running"
        | "paused"
        | "ended"
        | "reachable"
        | "unreachable"
        | "error";
    reason?: string | null;
    ts?: string | null;
    error?: string; // 하위호환
};

// 2) EventEmitter의 제네릭은 "이벤트명 ➜ 콜백타입" 맵이어야 함
type WatchEventMap = {
    heartRate: (event: { bpm: number; ts?: string | null }) => void;
    watchState: (event: WatchStatePayload) => void;
    watchMessage: (
        event:
            | {
                  type: "state";
                  state: string;
                  reason?: string | null;
                  ts?: string | null;
              }
            | {
                  type: "control";
                  action: "pause" | "resume" | "stop";
                  ts?: string | null;
              }
            | {
                  type: "metrics";
                  distanceM?: number;
                  paceSecPerKm?: number;
                  cadenceSpm?: number;
                  ts?: string | null;
              }
            | { type: "bpm"; bpm: number; ts?: string | null }
    ) => void;
};

// 3) 네이티브 모듈 인터페이스에 제네릭 적용 + 표준 add/remove 시그니처
declare class ExpoWatchModule extends NativeModule<WatchEventMap> {
    startWatchApp(): Promise<boolean>;
    startWorkout(activity: string, eventTs?: string): Promise<boolean>;
    stopWatch(eventTs?: string): Promise<boolean>;
    pauseWatch(eventTs?: string): Promise<boolean>;
    resumeWatch(eventTs?: string): Promise<boolean>;
    activateWC(): void;
    addListener(eventName: keyof WatchEventMap): EventSubscription;
    removeListeners(count: number): void;
}

const Native = requireNativeModule<ExpoWatchModule>("ExpoWatchModule");
const emitter = new EventEmitter<WatchEventMap>(Native);

export const nowIso = () => new Date().toISOString();

// ── Public API ───────────────────────────────────────────
export async function start() {
    Native.activateWC();
    const started = await Native.startWatchApp();
    if (!started) throw new Error("Failed to start watch app");
}

export async function startWorkout(
    activity: "running" | "cycling" = "running",
    eventTs: string = nowIso()
) {
    if (!(await Native.startWorkout(activity, eventTs)))
        throw new Error("Start failed");
}

export async function pause(eventTs: string = nowIso()) {
    if (!(await Native.pauseWatch(eventTs))) throw new Error("Pause failed");
}
export async function resume(eventTs: string = nowIso()) {
    if (!(await Native.resumeWatch(eventTs))) throw new Error("Resume failed");
}
export async function stop(eventTs: string = nowIso()) {
    if (!(await Native.stopWatch(eventTs))) throw new Error("Stop failed");
}

// 4) 이벤트 리스너 — 파라미터에 타입 명시 (암시적 any 방지)
export function onHeartRate(
    cb: (bpm: number, ts?: string | null) => void
): EventSubscription {
    return emitter.addListener("heartRate", (event) => {
        const bpm =
            typeof event?.bpm === "number" && Number.isFinite(event.bpm)
                ? event.bpm
                : 0;
        const ts = typeof event?.ts === "string" ? event.ts : null;
        cb(bpm, ts);
    });
}

export function onWatchState(
    cb: (event: WatchStatePayload) => void
): EventSubscription {
    return emitter.addListener("watchState", (event) => {
        // event는 WatchStatePayload로 정확히 타이핑됨
        cb(event);
    });
}

let pendingAutoStart: ReturnType<typeof setTimeout> | null = null;
let alreadyStarted = false;

export async function startFlowSafely(eventTs: string = nowIso()) {
    alreadyStarted = false;

    // 1) 워치 앱을 깨운다
    const ok = await Native.startWatchApp();
    if (!ok) throw new Error("Watch not available");

    // 2) ready 이벤트를 기다리되, 2~3초 타임아웃으로 재시도
    const tryKick = async () => {
        if (alreadyStarted) return;
        try {
            await startWorkout("running", eventTs);
            alreadyStarted = true;
        } catch {
            // 1.5초 후 한 번 더 시도
            pendingAutoStart = setTimeout(tryKick, 1500);
        }
    };

    // “ready / reachable” 수신 시 즉시 kick
    const sub = onWatchState((e) => {
        if (alreadyStarted) return;
        if (e.state === "ready" || e.state === "reachable") {
            tryKick();
        }
    });

    // 타임아웃(3초)까지 ready가 안 오면 일단 시도
    setTimeout(tryKick, 3000);

    // 정리자
    return () => {
        sub.remove();
        if (pendingAutoStart) {
            clearTimeout(pendingAutoStart);
            pendingAutoStart = null;
        }
    };
}

export default {
    start,
    pause,
    resume,
    stop,
    onHeartRate,
    onWatchState,
};
