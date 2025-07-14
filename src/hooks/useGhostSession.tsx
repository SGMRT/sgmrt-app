import { useCallback, useEffect, useRef, useState } from "react";
import { Telemetry } from "../apis/types/run";
import { Segment } from "../components/map/RunningLine";

export const useGhostSession = (ghostTelemetry: Telemetry[]) => {
    const [isRunning, setIsRunning] = useState(false);
    const elapsedTimeRef = useRef(0);
    const telemetryRef = useRef<Telemetry | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);

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

            // 마지막 순간이 끝났다면(러닝 종료) 보간값 없이 원본만 반환
            if (second >= ghostTelemetry.length - 1) {
                return { isRunning: true, points };
            }

            // 아니면 마지막에 보간값 추가
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

    // 현재 텔레메트리 보간(지도에 표시하거나 러닝 정보로 쓸 용도)
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
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        startTimeRef.current = performance.now() - elapsedTimeRef.current;

        const animate = () => {
            const now = performance.now();
            const elapsed = now - (startTimeRef.current ?? now);

            elapsedTimeRef.current = elapsed;

            if (now - lastUpdateTimeRef.current > 500) {
                const result = getCurrentTelemetry(elapsed);
                if (result) {
                    telemetryRef.current = result;
                    setSegments([buildSegment(elapsed)]);
                }
                lastUpdateTimeRef.current = now;
            }

            if (
                ghostTelemetry.length > 0 &&
                elapsed >= (ghostTelemetry.length - 1) * 1000
            ) {
                setIsRunning(false);
                return;
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current)
                cancelAnimationFrame(animationRef.current);
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
