import {
    EventEmitter,
    NativeModule,
    requireNativeModule,
} from "expo-modules-core";

type WatchEvents = {
    heartRate: (payload: { bpm: number }) => void;
    watchState: (payload: { state: string; error?: string }) => void;
};
type Subscription = { remove: () => void };

declare class ExpoWatchModule extends NativeModule {
    requestAuthorization(): Promise<boolean>;
    startWatchApp(): Promise<boolean>;
    stopWatch(): Promise<boolean>;
    activateWC(): void;
}

const Native = requireNativeModule<ExpoWatchModule>("ExpoWatchModule");
const emitter = new EventEmitter<WatchEvents>(Native);

export async function start() {
    const ok = await Native.requestAuthorization();
    if (!ok) throw new Error("HealthKit authorization failed");
    await Native.startWatchApp();
    Native.activateWC(); // 중복 호출 안전
}

export async function stop() {
    await Native.stopWatch();
}

export function onHeartRate(cb: (bpm: number) => void): Subscription {
    return emitter.addListener("heartRate", ({ bpm }) => cb(bpm ?? 0));
}
export function onWatchState(
    cb: (state: string, err?: string) => void
): Subscription {
    return emitter.addListener("watchState", ({ state, error }) =>
        cb(state, error)
    );
}

export default { start, stop, onHeartRate, onWatchState };
