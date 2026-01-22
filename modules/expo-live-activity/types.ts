export type ExpoLiveActivityModuleEvents = {
    // Live Activity 상태 변화 이벤트
    onLiveActivityCancel: () => void;
    onLiveActivityDismissed: () => void; // 사용자가 스와이프로 종료
    onLiveActivityStale: () => void; // 시스템이 자동 종료

    // Widget에서 보낸 액션 이벤트 (Darwin Notification)
    onWidgetPause: () => void;
    onWidgetResume: () => void;
    onWidgetComplete: () => void;
};

export type RunType = "SOLO" | "GHOST" | "COURSE";
export type MessageType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";
