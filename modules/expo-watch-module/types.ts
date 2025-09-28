// 공통 페이로드 타입
export type WatchPayload = {
    text?: string;
    type?: "text" | "ping" | "pong";
    [k: string]: any;
};

// iOS <-> watch 이벤트들
export type ExpoWatchModuleEvents = {
    watchMessage: (payload: WatchPayload) => void; // WATCH → PHONE
    phoneMessage: (payload: WatchPayload) => void; // PHONE → WATCH (에러/회신 등)
    activationStateChanged: (info: {
        state: number; // WCSessionActivationState.rawValue
        error?: string | null;
    }) => void;
};
