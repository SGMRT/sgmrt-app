import { useEffect, useState } from "react";
import { useBarometerTracker } from "./useBarometerTracker";
import { useLocationTracker } from "./useLocationTracker";
import { usePedometerTracker } from "./usePedometerTracker";

function findClosest<T extends { timestamp: number }>(
    records: T[],
    target: number
): T | undefined {
    if (!records.length) return undefined;
    let closest = records[0];
    let minDiff = Math.abs(records[0].timestamp - target);
    for (let i = 1; i < records.length; i++) {
        const diff = Math.abs(records[i].timestamp - target);
        if (diff < minDiff) {
            closest = records[i];
            minDiff = diff;
        }
    }
    return closest;
}

interface MergedRecord {
    timestamp: number;
    lat: number;
    lng: number;
    alt: number;
    relativeAltitude: number;
    stepDelta: number;
    stepTotal: number;
}

export default function useRunningSensors({
    intervalMs = 1000,
}: {
    intervalMs?: number;
}) {
    const { locations } = useLocationTracker();
    const { stepRecords } = usePedometerTracker();
    const { baroRecords } = useBarometerTracker();

    const [mergedRecords, setMergedRecords] = useState<MergedRecord[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            const location = findClosest(locations, now);
            const step = findClosest(stepRecords, now);
            const baro = findClosest(baroRecords, now);

            setMergedRecords((prev) => [
                ...prev.slice(-100),
                {
                    timestamp: now,
                    lat: location?.lat ?? 0,
                    lng: location?.lng ?? 0,
                    alt: location?.alt ?? 0,
                    relativeAltitude: baro?.relativeAltitude ?? 0,
                    stepDelta:
                        (step?.stepCount ?? 0) -
                        (prev[prev.length - 1]?.stepTotal ?? 0),
                    stepTotal: step?.stepCount ?? 0,
                },
            ]);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [locations, stepRecords, baroRecords, intervalMs]);

    return { mergedRecords };
}
