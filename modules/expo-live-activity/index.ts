import { NativeModule, requireNativeModule } from "expo";

export type ExpoLiveActivityModuleEvents = {
    onLiveActivityCancel: () => void;
};

declare class ExpoLiveActivityModule extends NativeModule<ExpoLiveActivityModuleEvents> {
    areActivitiesEnabled(): boolean;
    isActivityInProgress(): boolean;
    startActivity(
        startedAt: string,
        sessionId: string,
        runType: string,
        recentPace: string,
        distance: string,
        calories: string,
        progress?: number
    ): Promise<boolean>;
    updateActivity(
        startedAt: string,
        recentPace: string,
        distance: string,
        calories: string,
        pausedAt?: string,
        progress?: number
    ): void;
    endActivity(): void;
}

export default requireNativeModule<ExpoLiveActivityModule>("ExpoLiveActivity");
