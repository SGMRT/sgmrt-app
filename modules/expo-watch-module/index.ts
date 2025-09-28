import { NativeModule, requireNativeModule } from "expo";
import type { ExpoWatchModuleEvents, WatchPayload } from "./types";

declare class ExpoWatchModule extends NativeModule<ExpoWatchModuleEvents> {
    // WCSession 활성화
    start(): void;

    // PHONE → WATCH 즉시 전송 (상대가 reachability일 때)
    sendToWatch(payload: WatchPayload): void;

    // PHONE → WATCH 백그라운드 큐 전송 (eventual delivery)
    queueToWatch(payload: WatchPayload): void;
}

const Native = requireNativeModule<ExpoWatchModule>("ExpoWatchModule");
export default Native;

/** 세션 활성화  */
export function start() {
    Native.start();
}

/** 즉시 전송 (상대가 포그라운드/도달 가능할 때) */
export function sendToWatch(payload: WatchPayload) {
    Native.sendToWatch(payload);
}

/** 백그라운드 큐 전송 (도달 불가 시 보장형 전송) */
export function queueToWatch(payload: WatchPayload) {
    Native.queueToWatch(payload);
}

// 이벤트 타입 re-export
export type { ExpoWatchModuleEvents, WatchPayload } from "./types";
