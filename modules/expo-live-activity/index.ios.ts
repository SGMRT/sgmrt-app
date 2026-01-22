import { NativeModule, requireNativeModule } from "expo";
import { ExpoLiveActivityModuleEvents, MessageType, RunType } from "./types";

type EventName = keyof ExpoLiveActivityModuleEvents;
type EventSubscription = { remove: () => void };

declare class ExpoLiveActivityModule extends NativeModule<ExpoLiveActivityModuleEvents> {
    hasActiveActivities(): boolean;
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
    addListener(eventName: EventName, listener: () => void): EventSubscription;
}

const Native = requireNativeModule<ExpoLiveActivityModule>("ExpoLiveActivity");
export default Native;
