import { useRef, useCallback, useMemo } from "react";
import { addPhase, trackDuration } from "@/src/utils/sentryTools";
import { getRecordingPresetName } from "../config/recordingConfig";

type RecordingMetrics = {
    captureTimesMs: number[];
    encodeStartTime: number;
    totalFrames: number;
    droppedFrames: number;
    memoryPeakBytes: number;
    preset: string;
};

type MetricsReport = {
    totalFrames: number;
    droppedFrames: number;
    avgCaptureMs: number;
    maxCaptureMs: number;
    minCaptureMs: number;
    p95CaptureMs: number;
    memoryPeakMB: number;
    preset: string;
};

/**
 * 리플레이 녹화 성능 메트릭 수집 훅
 *
 * 프레임 캡처 시간, 메모리 사용량 등을 추적하여
 * Sentry breadcrumb으로 리포팅합니다.
 */
export function useRecordingMetrics() {
    const metricsRef = useRef<RecordingMetrics>({
        captureTimesMs: [],
        encodeStartTime: 0,
        totalFrames: 0,
        droppedFrames: 0,
        memoryPeakBytes: 0,
        preset: getRecordingPresetName(),
    });

    const sessionTimerRef = useRef<ReturnType<typeof trackDuration> | null>(
        null
    );

    /**
     * 녹화 세션 시작 시 호출
     */
    const startSession = useCallback(() => {
        metricsRef.current = {
            captureTimesMs: [],
            encodeStartTime: 0,
            totalFrames: 0,
            droppedFrames: 0,
            memoryPeakBytes: 0,
            preset: getRecordingPresetName(),
        };

        sessionTimerRef.current = trackDuration("replay.recordingSession", {
            preset: metricsRef.current.preset,
        });

        addPhase("replay.session_start", {
            preset: metricsRef.current.preset,
        });
    }, []);

    /**
     * 프레임 캡처 완료 시 호출
     */
    const recordCapture = useCallback(
        (durationMs: number, memoryBytes: number) => {
            const metrics = metricsRef.current;
            metrics.captureTimesMs.push(durationMs);
            metrics.totalFrames++;
            metrics.memoryPeakBytes = Math.max(
                metrics.memoryPeakBytes,
                memoryBytes
            );
        },
        []
    );

    /**
     * 프레임 드롭 시 호출
     */
    const recordDrop = useCallback(() => {
        metricsRef.current.droppedFrames++;
    }, []);

    /**
     * 인코딩 시작 시 호출
     */
    const markEncodeStart = useCallback(() => {
        metricsRef.current.encodeStartTime = Date.now();
        addPhase("replay.encode_start", {
            totalFrames: metricsRef.current.totalFrames,
        });
    }, []);

    /**
     * 평균 캡처 시간 반환
     */
    const getAverageCapture = useCallback(() => {
        const times = metricsRef.current.captureTimesMs;
        if (times.length === 0) return 0;
        return times.reduce((a, b) => a + b, 0) / times.length;
    }, []);

    /**
     * P95 캡처 시간 계산
     */
    const getP95Capture = useCallback(() => {
        const times = [...metricsRef.current.captureTimesMs].sort(
            (a, b) => a - b
        );
        if (times.length === 0) return 0;
        const idx = Math.floor(times.length * 0.95);
        return times[idx] ?? times[times.length - 1] ?? 0;
    }, []);

    /**
     * 전체 메트릭 리포트 생성
     */
    const getReport = useCallback((): MetricsReport => {
        const metrics = metricsRef.current;
        const times = metrics.captureTimesMs;

        return {
            totalFrames: metrics.totalFrames,
            droppedFrames: metrics.droppedFrames,
            avgCaptureMs:
                times.length > 0
                    ? times.reduce((a, b) => a + b, 0) / times.length
                    : 0,
            maxCaptureMs: times.length > 0 ? Math.max(...times) : 0,
            minCaptureMs: times.length > 0 ? Math.min(...times) : 0,
            p95CaptureMs: getP95Capture(),
            memoryPeakMB: metrics.memoryPeakBytes / (1024 * 1024),
            preset: metrics.preset,
        };
    }, [getP95Capture]);

    /**
     * 세션 종료 및 메트릭 리포팅
     */
    const endSession = useCallback(
        (success: boolean) => {
            const report = getReport();

            addPhase("replay.session_end", {
                success,
                ...report,
            });

            sessionTimerRef.current?.end({
                success,
                totalFrames: report.totalFrames,
                droppedFrames: report.droppedFrames,
                avgCaptureMs: Math.round(report.avgCaptureMs),
                p95CaptureMs: Math.round(report.p95CaptureMs),
                memoryPeakMB: Math.round(report.memoryPeakMB),
            });

            return report;
        },
        [getReport]
    );

    /**
     * 메트릭 초기화
     */
    const reset = useCallback(() => {
        metricsRef.current = {
            captureTimesMs: [],
            encodeStartTime: 0,
            totalFrames: 0,
            droppedFrames: 0,
            memoryPeakBytes: 0,
            preset: getRecordingPresetName(),
        };
        sessionTimerRef.current = null;
    }, []);

    // 안정적인 객체 반환을 위해 useMemo 사용
    // (매번 새 객체를 반환하면 의존성으로 사용 시 무한 재생성 문제 발생)
    return useMemo(
        () => ({
            startSession,
            recordCapture,
            recordDrop,
            markEncodeStart,
            getAverageCapture,
            getReport,
            endSession,
            reset,
        }),
        [
            startSession,
            recordCapture,
            recordDrop,
            markEncodeStart,
            getAverageCapture,
            getReport,
            endSession,
            reset,
        ]
    );
}
