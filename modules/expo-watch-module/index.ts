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
};

// 3) 네이티브 모듈 인터페이스에 제네릭 적용 + 표준 add/remove 시그니처
declare class ExpoWatchModule extends NativeModule<WatchEventMap> {
    requestAuthorization(): Promise<boolean>;
    startWatchApp(): Promise<boolean>;
    stopWatch(): Promise<boolean>;
    pauseWatch(): Promise<boolean>;
    resumeWatch(): Promise<boolean>;
    activateWC(): void;

    // RN 표준 시그니처 그대로 (리스너 함수 넣지 않음!)
    addListener(eventName: keyof WatchEventMap): EventSubscription;
    removeListeners(count: number): void;
}

const Native = requireNativeModule<ExpoWatchModule>("ExpoWatchModule");
const emitter = new EventEmitter<WatchEventMap>(Native);

// ── Public API ───────────────────────────────────────────
export async function start() {
    Native.activateWC();
    const ok = await Native.requestAuthorization();
    if (!ok) throw new Error("HealthKit authorization failed");
    const started = await Native.startWatchApp();
    if (!started) throw new Error("Failed to start watch app");
}

export async function pause() {
    if (!(await Native.pauseWatch())) throw new Error("Pause failed");
}
export async function resume() {
    if (!(await Native.resumeWatch())) throw new Error("Resume failed");
}
export async function stop() {
    if (!(await Native.stopWatch())) throw new Error("Stop failed");
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

export default { start, pause, resume, stop, onHeartRate, onWatchState };
