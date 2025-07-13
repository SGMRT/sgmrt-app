import { Telemetry } from "@/src/apis/types/run";
import { Coordinate, getDistance } from "@/src/utils/mapUtils";
import { useCallback, useEffect, useState } from "react";
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

export interface MergedRecord {
    timestamp: number;
    lat: number;
    lng: number;
    alt: number;
    relativeAltitude: number;
    deltaDistanceM: number;
    deltaAltitudeM: number;
    deltaStep: number;
    stepTotal: number;
}

export default function useRunningSensors({
    intervalMs = 1000,
    course,
}: {
    intervalMs?: number;
    course?: Telemetry[];
}) {
    const { locations } = useLocationTracker();
    const { stepRecords } = usePedometerTracker();
    const { baroRecords } = useBarometerTracker();

    const [mergedRecords, setMergedRecords] = useState<MergedRecord[]>([]);
    const [courseIndex, setCourseIndex] = useState<number>(-1);

    const checkPointSynced = useCallback(
        (targetPosition: Coordinate, currentPosition: Coordinate) => {
            const distance = getDistance(targetPosition, currentPosition);
            return distance < 5;
        },
        []
    );

    const findClosestPointIndex = useCallback(
        (currentPosition: Coordinate, telemetries: Telemetry[]) => {
            return telemetries.findIndex((telemetry) =>
                checkPointSynced(
                    { lat: telemetry.lat, lng: telemetry.lng },
                    currentPosition
                )
            );
        },
        [checkPointSynced]
    );

    useEffect(() => {
        if (course) {
            const index = findClosestPointIndex(locations.at(-1)!, course);
            setCourseIndex(index);
        }
    }, [course, findClosestPointIndex, locations]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            const location = findClosest(locations, now);
            const step = findClosest(stepRecords, now);
            const baro = findClosest(baroRecords, now);

            setMergedRecords((prev) => {
                if (location === undefined) return prev;
                return [
                    ...prev.slice(-29),
                    {
                        timestamp: now,
                        lat: Number((location?.lat ?? 0).toFixed(8)),
                        lng: Number((location?.lng ?? 0).toFixed(8)),
                        alt: Number((location?.alt ?? 0).toFixed(2)),
                        relativeAltitude: Number(
                            (baro?.relativeAltitude ?? 0).toFixed(2)
                        ),
                        deltaDistanceM:
                            prev.length > 0
                                ? Number(
                                      getDistance(
                                          {
                                              lat: location?.lat ?? 0,
                                              lng: location?.lng ?? 0,
                                          },
                                          {
                                              lat:
                                                  prev[prev.length - 1]?.lat ??
                                                  location?.lat ??
                                                  0,
                                              lng:
                                                  prev[prev.length - 1]?.lng ??
                                                  location?.lng ??
                                                  0,
                                          }
                                      ).toFixed(2)
                                  )
                                : 0,
                        deltaAltitudeM:
                            Number((baro?.relativeAltitude ?? 0).toFixed(2)) -
                            Number(
                                (
                                    prev[prev.length - 1]?.relativeAltitude ?? 0
                                ).toFixed(2)
                            ),
                        deltaStep:
                            (step?.stepCount ?? 0) -
                            (prev[prev.length - 1]?.stepTotal ?? 0),
                        stepTotal: step?.stepCount ?? 0,
                    },
                ];
            });
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs, locations, stepRecords, baroRecords]);

    return { mergedRecords, courseIndex };
}
