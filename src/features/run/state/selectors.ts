import { MessageType } from "@/modules/expo-live-activity";
import { RunContext } from "./context";

export type PolylineSeg = {
    isRunning: boolean;
    points: { latitude: number; longitude: number }[];
};

export function selectPolylineSegments(ctx: RunContext): PolylineSeg[] {
    const tele = ctx.telemetries ?? [];
    return (ctx.segments ?? []).map((seg) => ({
        isRunning: seg.isRunning,
        points: tele.slice(seg.start, seg.end + 1).map((t) => ({
            latitude: t.lat,
            longitude: t.lng,
        })),
    }));
}

export function selectLiveActivityPayload(ctx: RunContext) {
    const startedAtMs = ctx.liveActivity.startedAtMs ?? Date.now();
    const pausedAtMs = ctx.liveActivity.pausedAtMs ?? null;

    const lastTelemetry = ctx.telemetries.at(-1);
    const recentPace = lastTelemetry?.pace ?? ctx.stats.avgPaceSecPerKm ?? 0;

    const distanceMeters = ctx.stats.totalDistanceM ?? 0;

    const isCourse = ctx.mode === "COURSE";
    const progress = isCourse ? 0 : undefined;

    const message = "개발 필요";
    const messageType = "INFO" as MessageType;

    return {
        startedAtISO: new Date(startedAtMs).toISOString(),
        pausedAtISO: pausedAtMs
            ? new Date(pausedAtMs).toISOString()
            : undefined,
        recentPace,
        distanceMeters,
        progress,
        message,
        messageType,
    };
}
