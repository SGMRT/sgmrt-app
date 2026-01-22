// ReplayRecorder.tsx — 청크 스트리밍 인코딩 + 메모리 최적화
// - 프레임을 청크 단위로 네이티브 인코더에 전송하여 메모리 사용량 대폭 감소
// - 캡처 즉시 인코더로 전달 → base64 배열 누적 없음
// - 품질 적응형 캡처 유지

import {
    startStreamingEncoder,
    appendFrames,
    finishStreamingEncoder,
    createVideoFromBase64,
} from "@/modules/expo-image-to-video";
import { Telemetry } from "@/src/apis/types/run";
import { Stat, StatRow, Typography, showToast } from "@/src/components/ui";
import { interpolateTelemetries } from "@/src/utils/interpolateTelemetries";
import { normalizeTimestamps } from "@/src/utils/normalizeTimestamps";
import {
    captureError,
    ERROR_PRIORITY,
    trackDuration,
    addPhase,
} from "@/src/utils/sentryTools";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { Camera } from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system";
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { AppState, AppStateStatus, Platform, View } from "react-native";
import Share from "react-native-share";
import ViewShot, { captureRef } from "react-native-view-shot";
import {
    getRecordingConfig,
    clampQuality,
} from "./config/recordingConfig";
import { useRecordingMetrics } from "./hooks/useRecordingMetrics";
import { useReplay } from "./hooks/useReplay";
import PreviewMap from "./PreviewMap";

export type ReplayRecorderHandle = {
    startRecording: () => Promise<void>;
    stopAndExport: (opts?: { fileName?: string }) => Promise<string | null>;
    reset: () => void;
    getProgress: () => number;
};

type Props = {
    telemetries: Telemetry[];
    visualFps?: number;
    width?: number;
    height?: number;
    autoShare?: boolean;
    title?: string;
    message?: string;
    name?: string;
    stats?: Stat[];
    distance?: string | number;
    onProgress?: (progress: number) => void;
    onFinish?: () => void;
    captureTargetWidth?: number;
};

// 청크 크기: 24프레임(약 1초)마다 네이티브로 전송
const CHUNK_SIZE = 24;

export default forwardRef<ReplayRecorderHandle, Props>(function ReplayRecorder(
    {
        telemetries,
        visualFps: visualFpsProp,
        width = 360,
        height = 350,
        autoShare = false,
        title = "Replay",
        message = "Replay",
        name = "Ghost Runner",
        stats = [],
        distance = 0,
        onProgress,
        onFinish,
        captureTargetWidth: widthProp,
    },
    ref
) {
    // 기기별 최적화된 설정 적용
    const config = useMemo(() => getRecordingConfig(), []);
    const visualFps = visualFpsProp ?? config.visualFps;
    const captureTargetWidth = widthProp ?? config.targetWidth;

    const cameraRef = useRef<Camera | null>(null);
    const viewShotRef = useRef<ViewShot | null>(null);

    // 성능 메트릭 수집
    const metrics = useRecordingMetrics();

    // 데이터 전처리
    const interpolatedTelemetries = useMemo(
        () =>
            interpolateTelemetries(
                normalizeTimestamps(telemetries ?? []),
                1000,
                1
            ),
        [telemetries]
    );

    const samples = useMemo(
        () =>
            interpolatedTelemetries?.map((t) => ({
                x: t.lng,
                y: t.lat,
                d: t.dist,
                e: t.alt,
                p: t.pace,
                c: t.cadence,
                t: t.timeStamp,
            })) ?? [],
        [interpolatedTelemetries]
    );

    // 재생 훅
    const {
        progress,
        position,
        reset: resetReplay,
        stepForward,
        frameMs,
        visualFps: replayVisualFps,
    } = useReplay(Number(distance ?? 0) * 1000, samples, { visualFps });

    // 상태/레퍼런스
    const recordingRef = useRef(false);
    const [recording, setRecording] = useState(false);

    // 청크 버퍼 (CHUNK_SIZE 프레임마다 네이티브로 전송 후 비움)
    const chunkBufferRef = useRef<string[]>([]);
    // 폴백 버퍼 (스트리밍 실패 시 일괄 인코딩용)
    const fallbackBufferRef = useRef<string[]>([]);
    const indexRef = useRef(0);

    // 스트리밍 인코더 세션 ID
    const sessionIdRef = useRef<string | null>(null);
    const outputPathRef = useRef<string>("");

    // progress를 ref로 추적
    const progressRef = useRef(progress);
    progressRef.current = progress;

    type TimeoutId = ReturnType<typeof setTimeout>;
    const timerRef = useRef<TimeoutId | null>(null);

    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const microYield = () => new Promise((r) => setTimeout(r, 0));

    // 다운스케일 해상도
    const targetWidth = Math.max(128, Math.min(captureTargetWidth, 420));
    const targetHeight = Math.max(1, Math.round((targetWidth / 393) * 586));

    // 품질 (기기별 설정에 따른 초기값 및 범위)
    const currentQualityRef = useRef(config.initialQuality);
    const clampQ = (q: number) => clampQuality(q, config);

    // 청크를 네이티브로 전송
    const flushChunk = useCallback(async () => {
        if (!sessionIdRef.current || chunkBufferRef.current.length === 0) return;

        try {
            await appendFrames(sessionIdRef.current, chunkBufferRef.current);
            chunkBufferRef.current = []; // 버퍼 비우기 (메모리 해제)
        } catch (err) {
            captureError(
                "replay.flushChunk",
                err,
                {
                    sessionId: sessionIdRef.current,
                    chunkSize: chunkBufferRef.current.length,
                },
                { feature: "replay-video" },
                ERROR_PRIORITY.MEDIUM
            );
        }
    }, []);

    // 폴백 인코딩 (스트리밍 실패 시 버퍼의 프레임으로 일괄 생성)
    const fallbackEncode = useCallback(async (): Promise<string | null> => {
        if (fallbackBufferRef.current.length === 0) return null;

        try {
            const fallbackPath = `${FileSystem.documentDirectory}replay_fallback_${Date.now()}.mp4`;
            const fps = replayVisualFps ?? visualFps;
            const result = await createVideoFromBase64(
                fallbackBufferRef.current,
                fallbackPath,
                fps
            );
            return result.startsWith("file://") ? result : `file://${result}`;
        } catch {
            return null;
        }
    }, [replayVisualFps, visualFps]);

    // 인코딩 완료
    const finishEncoding = useCallback(async (): Promise<string | null> => {
        const timer = trackDuration("replay.finishEncoding", {
            frameCount: indexRef.current,
        });

        metrics.markEncodeStart();

        // 스트리밍 세션이 없으면 폴백 인코딩
        if (!sessionIdRef.current) {
            timer.end({ status: "fallback", reason: "no_session" });
            metrics.endSession(true);
            return fallbackEncode();
        }

        try {
            // 남은 청크 전송
            if (chunkBufferRef.current.length > 0) {
                await flushChunk();
            }

            addPhase("replay.encoding_finish", {
                frameCount: indexRef.current,
            });

            const result = await finishStreamingEncoder(sessionIdRef.current);
            sessionIdRef.current = null;
            // 스트리밍 성공 시 폴백 버퍼 해제
            fallbackBufferRef.current = [];

            timer.end({ status: "success", outputPath: result });
            metrics.endSession(true);
            return result.startsWith("file://") ? result : `file://${result}`;
        } catch (err) {
            timer.end({ status: "error" });
            metrics.endSession(false);
            captureError(
                "replay.finishEncoding",
                err,
                {
                    frameCount: indexRef.current,
                    platform: Platform.OS,
                },
                { feature: "replay-video" },
                ERROR_PRIORITY.HIGH
            );

            // 폴백: 버퍼에 남은 프레임으로 일괄 인코딩 시도
            return fallbackEncode();
        }
    }, [flushChunk, metrics, fallbackEncode]);

    const resetBuffers = useCallback(() => {
        chunkBufferRef.current = [];
        fallbackBufferRef.current = [];
        indexRef.current = 0;
        sessionIdRef.current = null;
        currentQualityRef.current = config.initialQuality;
        metrics.reset();
    }, [config.initialQuality, metrics]);

    // Frame-Locked 루프
    const frameLockedLoop = useCallback(async () => {
        if (!recordingRef.current) return;

        // 백그라운드면 잠시 대기
        if (appStateRef.current !== "active") {
            if (recordingRef.current) {
                timerRef.current = setTimeout(frameLockedLoop, 300);
            }
            return;
        }

        // 완료면 종료
        if (progressRef.current >= 1) {
            recordingRef.current = false;
            return;
        }

        // 1) 캡처
        const started = Date.now();
        try {
            await microYield();

            const uri = await captureRef(viewShotRef, {
                format: "jpg",
                result: "base64",
                quality: currentQualityRef.current,
                width: targetWidth,
                height: targetHeight,
            });

            if (uri) {
                const b64 = uri as string;
                chunkBufferRef.current.push(b64);
                // 폴백용 버퍼에도 저장 (스트리밍 실패 시 사용)
                fallbackBufferRef.current.push(b64);

                // 캡처 메트릭 기록
                const captureTime = Date.now() - started;
                metrics.recordCapture(captureTime, chunkBufferRef.current.length);

                indexRef.current++;

                // 청크 크기 도달 시 네이티브로 전송
                if (chunkBufferRef.current.length >= CHUNK_SIZE) {
                    await flushChunk();
                }
            }
        } catch (err) {
            metrics.recordDrop();
            captureError(
                "replay.frameCapture",
                err,
                {
                    frameIndex: indexRef.current,
                    quality: currentQualityRef.current,
                    progress: progressRef.current,
                },
                { feature: "replay-video" },
                ERROR_PRIORITY.MEDIUM
            );
        }

        const elapsed = Date.now() - started;

        // 2) 품질 적응
        const targetCaptureMs = Math.max(6, frameMs * 0.7);
        if (elapsed > targetCaptureMs) {
            currentQualityRef.current = clampQ(
                currentQualityRef.current - 0.01
            );
        } else if (elapsed < targetCaptureMs * 0.6) {
            currentQualityRef.current = clampQ(
                currentQualityRef.current + 0.005
            );
        }

        // 3) 다음 프레임으로 전진
        stepForward();

        // 4) 다음 사이클 예약
        if (recordingRef.current) {
            const bleed = elapsed < 4 ? 1 : 0;
            timerRef.current = setTimeout(frameLockedLoop, bleed);
        }
    }, [
        targetWidth,
        targetHeight,
        frameMs,
        stepForward,
        flushChunk,
        metrics,
    ]);

    // 수명주기/제어
    const startLoop = useCallback(async () => {
        resetBuffers();
        metrics.startSession();

        // 스트리밍 인코더 시작
        const sessionId = `replay_${Date.now()}`;
        const outputPath = `${FileSystem.documentDirectory}replay_${Date.now()}.mp4`;
        outputPathRef.current = outputPath;

        try {
            await startStreamingEncoder(
                sessionId,
                outputPath,
                replayVisualFps ?? visualFps,
                targetWidth,
                targetHeight
            );
            sessionIdRef.current = sessionId;
        } catch (err) {
            captureError(
                "replay.startStreamingEncoder",
                err,
                { sessionId, outputPath },
                { feature: "replay-video" },
                ERROR_PRIORITY.HIGH
            );
            // 스트리밍 실패 시에도 계속 진행 (나중에 폴백 인코딩)
        }

        setRecording(true);
        recordingRef.current = true;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(frameLockedLoop, 0);
    }, [resetBuffers, frameLockedLoop, metrics, replayVisualFps, visualFps, targetWidth, targetHeight]);

    const stopLoop = useCallback(() => {
        recordingRef.current = false;
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener("change", (s) => {
            appStateRef.current = s;
            if (s !== "active") {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
                return;
            }
            if (recordingRef.current && !timerRef.current) {
                timerRef.current = setTimeout(frameLockedLoop, 0);
            }
        });
        return () => sub.remove();
    }, [frameLockedLoop]);

    useEffect(() => () => stopLoop(), [stopLoop]);

    useImperativeHandle(ref, () => ({
        async startRecording() {
            if (recordingRef.current) return;
            await startLoop();
        },
        async stopAndExport(opts) {
            setRecording(false);
            stopLoop();

            const path = await finishEncoding();
            if (path && autoShare) {
                await Share.open({
                    url: path,
                    title,
                    message,
                    filename: (opts?.fileName ?? "replay") + ".mp4",
                    type: "video/mp4",
                    saveToFiles: false,
                    failOnCancel: false,
                })
                    .then(() => {
                        trackAmplitude("Run Shared", {
                            variant: "video",
                        });
                    })
                    .catch(() => {
                        showToast("info", "공유에 실패했습니다", 100);
                    });
            }
            return path;
        },
        reset() {
            setRecording(false);
            stopLoop();
            onProgress?.(-1);
            resetBuffers();
            resetReplay();
        },
        getProgress() {
            return progress;
        },
    }));

    // 자동 완료 시 인코딩+콜백
    useEffect(() => {
        if (progress >= 1 && recording) {
            setRecording(false);
            stopLoop();
            finishEncoding()
                .then((path) => {
                    if (autoShare && path)
                        void Share.open({
                            url: path,
                            title,
                            message,
                            filename: (name ?? "replay") + ".mp4",
                            type: "video/mp4",
                            saveToFiles: false,
                            failOnCancel: false,
                        }).catch(() => {
                            showToast("info", "공유에 실패했습니다", 100);
                        });
                })
                .finally(() => onFinish?.());
        }
    }, [
        progress,
        recording,
        stopLoop,
        finishEncoding,
        autoShare,
        title,
        message,
        name,
        onFinish,
    ]);

    // 진행률 보수적 푸시
    useEffect(() => {
        if (!recording) return;
        if (indexRef.current % 24 === 0) onProgress?.(progress);
    }, [onProgress, progress, recording]);

    // 뷰
    return (
        <View style={{ position: "absolute", zIndex: -1000, top: 200 }}>
            <ViewShot
                ref={viewShotRef}
                options={{
                    format: "jpg",
                    result: "base64",
                    quality: 0.15,
                }}
            >
                <View
                    style={{ paddingVertical: 24, backgroundColor: "#111111" }}
                >
                    <View style={{ marginBottom: 10, marginLeft: 16 }}>
                        <Typography variant="display2" color="white">
                            {name}
                        </Typography>
                        <Typography variant="share_headline" color="white">
                            {distance}km
                        </Typography>
                    </View>

                    <View
                        style={{
                            width,
                            height,
                            borderRadius: 16,
                            overflow: "hidden",
                            marginHorizontal: 16,
                        }}
                    >
                        <PreviewMap
                            route={samples}
                            lng={position.x}
                            lat={position.y}
                            heading={position.heading}
                            cameraRef={cameraRef}
                            progress={Math.max(0, Math.min(1, progress))}
                            pause={() => {}}
                            play={() => {}}
                            controlEnabled={false}
                            captureMode={true}
                        />
                    </View>

                    <StatRow
                        stats={stats?.slice(0, 4) ?? []}
                        style={{ marginLeft: 16, marginTop: 24, gap: 12 }}
                        variant="share_stat"
                        descriptionVariant="share_stat_description"
                        color="white"
                        descriptionColor="gray60"
                        divider={false}
                        options={{ style: { minWidth: 78 } }}
                    />
                </View>
            </ViewShot>
        </View>
    );
});
