import { useCallback, useEffect, useRef, useState } from "react";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";

export const useGhostSession = (ghostTelemetry: Telemetry[]) => {
    const [isRunning, setIsRunning] = useState(false);
    const elapsedTimeRef = useRef(0);
    const telemetryRef = useRef<Telemetry | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // 보간 포함, 원본값만 누적하는 세그먼트 생성
    const buildSegment = useCallback(
        (elapsed: number): Segment => {
            if (ghostTelemetry.length === 0)
                return { isRunning: true, points: [] };

            const second = Math.floor(elapsed / 1000);
            const points = ghostTelemetry
                .slice(0, Math.min(second + 1, ghostTelemetry.length))
                .map((t) => ({
                    longitude: t.lng,
                    latitude: t.lat,
                }));

            if (second >= ghostTelemetry.length - 1) {
                return { isRunning: true, points };
            }

            const prev = ghostTelemetry[second];
            const next = ghostTelemetry[second + 1];
            const fraction = elapsed / 1000 - second;
            const interpolated = {
                longitude: prev.lng + (next.lng - prev.lng) * fraction,
                latitude: prev.lat + (next.lat - prev.lat) * fraction,
            };

            return { isRunning: true, points: [...points, interpolated] };
        },
        [ghostTelemetry]
    );

    const getCurrentTelemetry = useCallback(
        (elapsed: number): Telemetry | null => {
            if (ghostTelemetry.length === 0) return null;

            const second = Math.floor(elapsed / 1000);
            if (second >= ghostTelemetry.length - 1)
                return { ...ghostTelemetry[ghostTelemetry.length - 1] };

            const prev = ghostTelemetry[second];
            const next = ghostTelemetry[second + 1];
            const fraction = elapsed / 1000 - second;

            return {
                timeStamp:
                    prev.timeStamp +
                    (next.timeStamp - prev.timeStamp) * fraction,
                lat: prev.lat + (next.lat - prev.lat) * fraction,
                lng: prev.lng + (next.lng - prev.lng) * fraction,
                dist: prev.dist + (next.dist - prev.dist) * fraction,
                pace: prev.pace + (next.pace - prev.pace) * fraction,
                alt: prev.alt + (next.alt - prev.alt) * fraction,
                cadence:
                    prev.cadence + (next.cadence - prev.cadence) * fraction,
                bpm: prev.bpm + (next.bpm - prev.bpm) * fraction,
                isRunning: true,
            };
        },
        [ghostTelemetry]
    );

    useEffect(() => {
        if (!isRunning || ghostTelemetry.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // 최초 시작 시간 기준
        startTimeRef.current = Date.now() - elapsedTimeRef.current;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - (startTimeRef.current ?? now);

            elapsedTimeRef.current = elapsed;
            const result = getCurrentTelemetry(elapsed);
            if (result) {
                telemetryRef.current = result;
                setSegments([buildSegment(elapsed)]);
            }

            if (
                ghostTelemetry.length > 0 &&
                elapsed >= (ghostTelemetry.length - 1) * 1000
            ) {
                setIsRunning(false);
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, ghostTelemetry, getCurrentTelemetry, buildSegment]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);
    const reset = useCallback(() => {
        setIsRunning(false);
        elapsedTimeRef.current = 0;
        telemetryRef.current = null;
        setSegments([]);
    }, []);

    useEffect(() => {
        reset();
    }, [reset, ghostTelemetry]);

    return {
        currentTelemetry: telemetryRef.current,
        segments,
        elapsedTime: elapsedTimeRef.current,
        isRunning,
        start,
        pause,
        reset,
    };
};
