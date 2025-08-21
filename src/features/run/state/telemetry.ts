import { Telemetry } from "@/src/apis/types/run";
import { RawRunData } from "../types";
import { RunningStats } from "./stats";

export function buildTelemetry(
    statsAfterUpdate: RunningStats,
    sample: RawRunData,
    prev?: Telemetry,
    isRunning: boolean = false
): Telemetry {
    return {
        timeStamp: isRunning ? sample.timestamp : prev?.timeStamp ?? 0,
        lat: sample.latitude,
        lng: sample.longitude,
        dist: isRunning
            ? statsAfterUpdate.totalDistanceM / 1000
            : prev?.dist ?? 0,
        pace: isRunning
            ? statsAfterUpdate.currentPaceSecPerKm ?? prev?.pace ?? 0
            : prev?.pace ?? 0,
        alt: sample.altitude ?? prev?.alt ?? 0,
        cadence: isRunning
            ? statsAfterUpdate.cadenceSpm ?? prev?.cadence ?? 0
            : prev?.cadence ?? 0,
        bpm: prev?.bpm ?? 0,
        isRunning,
    };
}
