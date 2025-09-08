import { MessageType, RunType } from "./types";

const Noop = {
    hasActiveAcitivites(): boolean {
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
};

export default Noop;
