import { MessageType } from "@/modules/expo-live-activity";
import { RunContext } from "./context";

export type PolylineSeg = {
    id: string;
    isRunning: boolean;
    points: { latitude: number; longitude: number }[];
};

export function selectPolylineSegments(ctx: RunContext): PolylineSeg[] {
    const tele = ctx.telemetries ?? [];
    return (ctx.segments ?? []).map((seg) => ({
        isRunning: seg.isRunning,
        id: `${seg.start}-${seg.isRunning ? "R" : "P"}`,
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

export const isRunningNow = (status: RunContext["status"]) =>
    status === "RUNNING" || status === "RUNNING_EXTENDED";

export function selectStatsDisplay(context: RunContext) {
    const stats = context.stats;
    const km = (stats.totalDistanceM ?? 0) / 1000;
    const formatPace = (sec: number | null) => {
        if (!sec || sec <= 0 || !Number.isFinite(sec) || sec >= 1800)
            return "-'-''";
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        return `${minutes}’${seconds.toString().padStart(2, "0")}”`;
    };
    return [
        { label: "거리", value: km.toFixed(2), unit: "km" },
        {
            label: "평균 페이스",
            value: formatPace(stats.avgPaceSecPerKm),
            unit: "",
        },
        {
            label: "최근 페이스",
            value: formatPace(stats.currentPaceSecPerKm),
            unit: "",
        },
        {
            label: "케이던스",
            value: Math.round(stats.currentCadenceSpm ?? 0),
            unit: "spm",
        },
        {
            label: "심박수",
            value: Math.round(stats.bpm ?? 0),
            unit: "",
        },
        {
            label: "소모 칼로리",
            value: Math.round(stats.calories ?? 0),
            unit: "kcal",
        },
    ];
}
