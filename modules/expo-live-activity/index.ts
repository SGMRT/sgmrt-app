import { Platform } from "react-native";
import androidModule from "./index.android";
import iosModule from "./index.ios";
import { ExpoLiveActivityModuleEvents, MessageType, RunType } from "./types";

type EventName = keyof ExpoLiveActivityModuleEvents;
type EventSubscription = { remove: () => void };

export interface ExpoLiveActivityInterface {
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

// 플랫폼별로 적절한 모듈을 가져옴
const expoLiveActivity: ExpoLiveActivityInterface = Platform.select({
    ios: iosModule,
    android: androidModule,
    default: androidModule,
})!;

export default expoLiveActivity;
export * from "./types";
