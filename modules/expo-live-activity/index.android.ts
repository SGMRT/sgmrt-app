import {
    ExpoLiveActivityModuleEvents,
    MessageType,
    RunType,
} from "./types";

type EventName = keyof ExpoLiveActivityModuleEvents;
type EventSubscription = { remove: () => void };

const Noop = {
    hasActiveActivities(): boolean {
        return false;
    },
    isActivityInProgress(): boolean {
        return false;
    },
    async startActivity(
        _runType: RunType,
        _sessionId: string,
        _startedAt: string,
        _recentPace: number,
        _distanceMeters: number,
        _progress?: number,
        _message?: string,
        _messageType?: MessageType
    ): Promise<boolean> {
        return false;
    },
    updateActivity(
        _startedAt: string,
        _recentPace: number,
        _distanceMeters: number,
        _pausedAt?: string,
        _progress?: number,
        _message?: string,
        _messageType?: MessageType
    ): void {
        /* no-op */
    },
    endActivity(): void {
        /* no-op */
    },
    // 이벤트 리스너 (Android에서는 no-op)
    addListener(_eventName: EventName, _listener: () => void): EventSubscription {
        return { remove: () => {} };
    },
};

export default Noop;
