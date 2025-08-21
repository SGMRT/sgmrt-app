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
