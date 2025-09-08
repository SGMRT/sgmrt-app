import { NativeModule, requireNativeModule } from "expo";
import { ExpoLiveActivityModuleEvents, MessageType, RunType } from "./types";

declare class ExpoLiveActivityModule extends NativeModule<ExpoLiveActivityModuleEvents> {
    hasActiveAcitivites(): boolean;
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

const Native = requireNativeModule<ExpoLiveActivityModule>("ExpoLiveActivity");
export default Native;
