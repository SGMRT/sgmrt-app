import { NativeModule, requireNativeModule } from "expo";

export type ExpoLiveActivityModuleEvents = {
    onLiveActivityCancel: () => void;
};

export type RunType = "SOLO" | "GHOST" | "COURSE";
export type MessageType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";
declare class ExpoLiveActivityModule extends NativeModule<ExpoLiveActivityModuleEvents> {
    areActivitiesEnabled(): boolean;
    isActivityInProgress(): boolean;
    startActivity(
        runType: RunType,
        sessionId: string,
        startedAt: string,
        recentPace: number,
        distanceMeters: number,
        progress?: number,
        message?: string,
        messageType?: MessageType
    ): Promise<boolean>;
    updateActivity(
        startedAt: string,
        recentPace: number,
        distanceMeters: number,
        pausedAt?: string,
        progress?: number,
        message?: string,
        messageType?: MessageType
    ): void;
    endActivity(): void;
}

export default requireNativeModule<ExpoLiveActivityModule>("ExpoLiveActivity");
