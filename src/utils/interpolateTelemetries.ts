import { Telemetry } from "../apis/types/run";

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
export function interpolateTelemetries(
    telemetries: Telemetry[],
    interval: number = 250
): Telemetry[] {
    if (!telemetries.length) return [];
    const sorted = [...telemetries].sort((a, b) => a.timeStamp - b.timeStamp);
    const startTime = sorted[0].timeStamp;
    const endTime = sorted[sorted.length - 1].timeStamp;
    const result: Telemetry[] = [];
    let currIdx = 0;
    for (let t = startTime; t <= endTime; t += interval) {
        while (
            currIdx < sorted.length - 2 &&
            t > sorted[currIdx + 1].timeStamp
        ) {
            currIdx++;
        }
        const prev = sorted[currIdx];
        const next = sorted[Math.min(currIdx + 1, sorted.length - 1)];
        if (t === prev.timeStamp) {
            result.push({ ...prev });
            continue;
        }
        if (t === next.timeStamp) {
            result.push({ ...next });
            continue;
        }
        if (prev.timeStamp === next.timeStamp) {
            result.push({ ...prev });
            continue;
        }
        const frac = (t - prev.timeStamp) / (next.timeStamp - prev.timeStamp);
        result.push({
            timeStamp: t,
            lat: lerp(prev.lat, next.lat, frac),
            lng: lerp(prev.lng, next.lng, frac),
            dist: lerp(prev.dist, next.dist, frac),
            pace: lerp(prev.pace, next.pace, frac),
            alt: lerp(prev.alt, next.alt, frac),
            cadence: Math.round(lerp(prev.cadence, next.cadence, frac)),
            bpm: Math.round(lerp(prev.bpm, next.bpm, frac)),
            isRunning: prev.isRunning && next.isRunning,
        });
    }
    return result;
}

export function findClosest<T>(
    records: T[],
    target: number,
    getTime: (record: T) => number = (r) => (r as any).timestamp
): T | undefined {
    const n = records.length;
    if (n === 0) return undefined;
    if (n === 1) return records[0];

    let left = 0;
    let right = n - 1;

    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (getTime(records[mid]) < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    const prevIdx = left - 1;
    const currIdx = left;

    if (prevIdx < 0) return records[currIdx];
    if (currIdx >= n) return records[prevIdx];

    const prevDiff = Math.abs(getTime(records[prevIdx]) - target);
    const currDiff = Math.abs(getTime(records[currIdx]) - target);

    return prevDiff <= currDiff ? records[prevIdx] : records[currIdx];
}
