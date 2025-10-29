import { Pacemaker } from "@/src/apis/types/ghosty";
import { Telemetry } from "@/src/apis/types/run";

export interface GhostySet {
    initialMessage: string;
    sets: GhostySetComputed[];
}

export interface GhostySetComputed {
    message: string;
    startPointIndex: number;
    endPointIndex: number;
    telemetries: Telemetry[];
    pace: number; // min/km
    duration: number; // sec
}

export function mapPacemakerToGhostySets(
    telemetries: Telemetry[] | undefined,
    pacemaker: Pacemaker | undefined,
    options: {
        distanceScale?: number;
    } = {}
): GhostySet | null {
    const { distanceScale = 1000 } = options;

    const t = telemetries;
    const p = pacemaker;

    if (!t || t.length === 0 || !p) return null;

    const lastIdx = t.length - 1;
    const rawDists = t.map((it) => it.dist);

    const dists = rawDists;

    let cursor = 0;

    const nearestIndex = (target: number) => {
        while (cursor < dists.length && dists[cursor] < target) cursor++;
        if (cursor <= 0) return 0;
        if (cursor >= dists.length) return lastIdx;
        const l = cursor - 1;
        const r = cursor;
        return Math.abs(dists[l] - target) <= Math.abs(dists[r] - target)
            ? l
            : r;
    };

    const rawSets: GhostySetComputed[] = p.sets.map((s) => {
        const si = nearestIndex(s.startPoint * distanceScale);
        const ei = nearestIndex(s.endPoint * distanceScale);
        const start = Math.max(0, si);
        const end = Math.min(ei, lastIdx);
        return {
            message: s.message,
            startPointIndex: start,
            endPointIndex: end,
            telemetries: t.slice(start, end + 1),
            pace: s.pace,
            duration: Math.round((s.endPoint - s.startPoint) * s.pace * 60),
        };
    });

    if (rawSets.length === 0) {
        return { initialMessage: p.initialMessage, sets: [] };
    }

    // 1) 첫 세트 시작 = 0
    rawSets[0].startPointIndex = 0;
    rawSets[0].telemetries = t.slice(0, rawSets[0].endPointIndex + 1);

    // 2) 마지막 세트 끝 = lastIdx
    const last = rawSets.length - 1;
    rawSets[last].endPointIndex = lastIdx;
    rawSets[last].telemetries = t.slice(
        rawSets[last].startPointIndex,
        lastIdx + 1
    );

    // 3) 겹침, 역전 방지
    for (let i = 1; i < rawSets.length; i++) {
        const prevEnd = rawSets[i - 1].endPointIndex;
        if (rawSets[i].startPointIndex < prevEnd) {
            rawSets[i].startPointIndex = prevEnd;
        }
        if (rawSets[i].endPointIndex <= rawSets[i].startPointIndex) {
            rawSets[i].endPointIndex = Math.min(
                rawSets[i].startPointIndex + 1,
                lastIdx
            );
        }
        rawSets[i].telemetries = t.slice(
            rawSets[i].startPointIndex,
            rawSets[i].endPointIndex + 1
        );
    }

    return { initialMessage: p.initialMessage, sets: rawSets };
}
