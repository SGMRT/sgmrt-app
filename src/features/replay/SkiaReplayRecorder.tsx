/**
 * Skia 기반 리플레이 레코더
 *
 * ViewShot 대신 Skia Canvas + makeImageSnapshotAsync를 사용하여
 * GPU 가속 렌더링으로 빠른 캡처 속도를 달성합니다.
 *
 * 벤치마크 결과: ViewShot 대비 68% 빠른 캡처 속도
 */

import { createVideoFromBase64 } from "@/modules/expo-image-to-video";
import { Telemetry } from "@/src/apis/types/run";
import { Stat, showToast } from "@/src/components/ui";
import { interpolateTelemetries } from "@/src/utils/interpolateTelemetries";
import { normalizeTimestamps } from "@/src/utils/normalizeTimestamps";
import {
    captureError,
    ERROR_PRIORITY,
    trackDuration,
    addPhase,
} from "@/src/utils/sentryTools";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import {
    Canvas,
    Image,
    useCanvasRef,
    useImage,
    Skia,
    RoundedRect,
    useFont,
    SkCanvas,
    Path,
    Circle,
    Group,
} from "@shopify/react-native-skia";
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
import { getRecordingConfig } from "./config/recordingConfig";
import { useRecordingMetrics } from "./hooks/useRecordingMetrics";
import { useReplay } from "./hooks/useReplay";
import { Sample, ReplayStats } from "./types";
import { buildStaticMapUrl, calculateBounds, MapBounds, geoToCanvas } from "./skia/useMapSnapshot";
import { createRoutePath, createProgressPath, getProgressPosition, ROUTE_STYLE_PRESETS } from "./skia/drawRoute";
import { formatDistance, formatTime } from "./skia/drawStats";

export type SkiaReplayRecorderHandle = {
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
    distance?: string | number; // km
    onProgress?: (progress: number) => void;
    onFinish?: () => void;
};

// Uint8Array를 Base64로 변환
function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default forwardRef<SkiaReplayRecorderHandle, Props>(function SkiaReplayRecorder(
    {
        telemetries,
        visualFps: visualFpsProp,
        width = 393,
        height = 586,
        autoShare = false,
        title = "Replay",
        message = "Replay",
        name = "Ghost Runner",
        distance = 0,
        onProgress,
        onFinish,
    },
    ref
) {
    // 기기별 최적화된 설정 적용
    const config = useMemo(() => getRecordingConfig(), []);
    const visualFps = visualFpsProp ?? config.visualFps;

    const canvasRef = useCanvasRef();

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

    const samples = useMemo<Sample[]>(
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

    // 지도 bounds 계산
    const bounds = useMemo(() => calculateBounds(samples), [samples]);

    // 정적 지도 URL 생성
    const mapUrl = useMemo(
        () =>
            buildStaticMapUrl(samples, {
                width,
                height,
                padding: 0.15,
                style: "mapbox/dark-v11",
            }),
        [samples, width, height]
    );

    // 정적 지도 이미지 로드
    const mapImage = useImage(mapUrl);

    // 재생 훅
    const {
        progress,
        stats: replayStats,
        reset: resetReplay,
        stepForward,
        visualFps: replayVisualFps,
    } = useReplay(Number(distance ?? 0) * 1000, samples, { visualFps });

    // 경로 Path 생성
    const basePath = useMemo(
        () => (bounds ? createRoutePath(samples, bounds, width, height, 0.15) : null),
        [samples, bounds, width, height]
    );

    const progressPath = useMemo(
        () => (bounds ? createProgressPath(samples, bounds, width, height, 0.15, progress) : null),
        [samples, bounds, width, height, progress]
    );

    const runnerPosition = useMemo(
        () => (bounds ? getProgressPosition(samples, bounds, width, height, 0.15, progress) : { x: width / 2, y: height / 2 }),
        [samples, bounds, width, height, progress]
    );

    // 상태/레퍼런스
    const recordingRef = useRef(false);
    const [recording, setRecording] = useState(false);

    const base64FramesRef = useRef<string[]>([]);
    const indexRef = useRef(0);

    // progress를 ref로 추적하여 콜백 의존성 안정화
    const progressRef = useRef(progress);
    progressRef.current = progress;

    type TimeoutId = ReturnType<typeof setTimeout>;
    const timerRef = useRef<TimeoutId | null>(null);

    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // 유틸: 프레임을 비디오로 변환
    const combineFramesToVideo = useCallback(async (): Promise<string | null> => {
        const outputPath = `${FileSystem.documentDirectory}skia_replay_${Date.now()}.mp4`;

        const timer = trackDuration("skiaReplay.combineFramesToVideo", {
            frameCount: base64FramesRef.current.length,
        });

        metrics.markEncodeStart();

        try {
            const frames = base64FramesRef.current;
            if (!frames.length) {
                timer.end({ status: "no_frames" });
                metrics.endSession(false);
                return null;
            }

            const fps = replayVisualFps ?? visualFps;
            addPhase("skiaReplay.encoding_start", {
                frameCount: frames.length,
                fps,
            });

            const result = await createVideoFromBase64(frames, outputPath, fps);

            timer.end({ status: "success", outputPath: result });
            metrics.endSession(true);
            return result.startsWith("file://") ? result : `file://${result}`;
        } catch (err) {
            timer.end({ status: "error" });
            metrics.endSession(false);
            captureError(
                "skiaReplay.combineFramesToVideo",
                err,
                {
                    frameCount: base64FramesRef.current.length,
                    platform: Platform.OS,
                },
                { feature: "skia-replay-video" },
                ERROR_PRIORITY.HIGH
            );
            return null;
        }
    }, [replayVisualFps, visualFps, metrics]);

    const resetBuffers = useCallback(() => {
        base64FramesRef.current = [];
        indexRef.current = 0;
        metrics.reset();
    }, [metrics]);

    // Frame-Locked 캡처 루프
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

        // 캡처
        const started = Date.now();
        try {
            if (canvasRef.current) {
                const image = await canvasRef.current.makeImageSnapshotAsync();
                if (image) {
                    const bytes = image.encodeToBytes();
                    if (bytes) {
                        const base64 = uint8ArrayToBase64(bytes);
                        base64FramesRef.current.push(base64);

                        const captureTime = Date.now() - started;
                        metrics.recordCapture(captureTime, base64.length);
                        indexRef.current++;
                    }
                }
            }
        } catch (err) {
            metrics.recordDrop();
            captureError(
                "skiaReplay.frameCapture",
                err,
                {
                    frameIndex: indexRef.current,
                    progress: progressRef.current,
                },
                { feature: "skia-replay-video" },
                ERROR_PRIORITY.MEDIUM
            );
        }

        // 다음 프레임으로 전진
        stepForward();

        // 다음 사이클 예약
        if (recordingRef.current) {
            timerRef.current = setTimeout(frameLockedLoop, 0);
        }
    }, [metrics, stepForward]);

    // 수명주기/제어
    const startLoop = useCallback(async () => {
        resetBuffers();
        metrics.startSession();
        setRecording(true);
        recordingRef.current = true;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(frameLockedLoop, 0);
    }, [resetBuffers, frameLockedLoop, metrics]);

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

            const path = await combineFramesToVideo();
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
                            variant: "skia-video",
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

    // 자동 완료 시 병합+콜백
    useEffect(() => {
        if (progress >= 1 && recording) {
            setRecording(false);
            stopLoop();
            combineFramesToVideo()
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
        combineFramesToVideo,
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

    const routeStyle = ROUTE_STYLE_PRESETS.default;

    // Skia Canvas 렌더링 (선언적)
    return (
        <View style={{ position: "absolute", zIndex: -1000, top: 200, opacity: 0 }}>
            <Canvas ref={canvasRef} style={{ width, height }}>
                {/* 배경 */}
                <RoundedRect x={0} y={0} width={width} height={height} r={0} color="#111111" />

                {/* 지도 이미지 */}
                {mapImage && <Image image={mapImage} x={0} y={0} width={width} height={height} />}

                {/* 베이스 경로 (전체) */}
                {basePath && (
                    <Path
                        path={basePath}
                        color={routeStyle.baseColor}
                        style="stroke"
                        strokeWidth={routeStyle.strokeWidth}
                        strokeCap="round"
                        strokeJoin="round"
                    />
                )}

                {/* 진행된 경로 (글로우) */}
                {progressPath && routeStyle.glowColor && (
                    <Path
                        path={progressPath}
                        color={routeStyle.glowColor}
                        style="stroke"
                        strokeWidth={routeStyle.strokeWidth + 6}
                        strokeCap="round"
                        strokeJoin="round"
                    />
                )}

                {/* 진행된 경로 (메인) */}
                {progressPath && (
                    <Path
                        path={progressPath}
                        color={routeStyle.progressColor}
                        style="stroke"
                        strokeWidth={routeStyle.strokeWidth}
                        strokeCap="round"
                        strokeJoin="round"
                    />
                )}

                {/* 러너 아이콘 (글로우) */}
                {routeStyle.glowColor && (
                    <Circle
                        cx={runnerPosition.x}
                        cy={runnerPosition.y}
                        r={routeStyle.runnerSize + 4}
                        color={routeStyle.glowColor}
                    />
                )}

                {/* 러너 아이콘 (메인) */}
                <Circle
                    cx={runnerPosition.x}
                    cy={runnerPosition.y}
                    r={routeStyle.runnerSize}
                    color={routeStyle.progressColor}
                />

                {/* 러너 아이콘 (테두리) */}
                <Circle
                    cx={runnerPosition.x}
                    cy={runnerPosition.y}
                    r={routeStyle.runnerSize}
                    color="#FFFFFF"
                    style="stroke"
                    strokeWidth={2}
                />

                {/* 프로그레스 바 배경 */}
                <RoundedRect
                    x={16}
                    y={height - 16}
                    width={width - 32}
                    height={4}
                    r={2}
                    color="rgba(255, 255, 255, 0.2)"
                />

                {/* 프로그레스 바 */}
                <RoundedRect
                    x={16}
                    y={height - 16}
                    width={(width - 32) * Math.max(0, Math.min(1, progress))}
                    height={4}
                    r={2}
                    color="#00FF88"
                />
            </Canvas>
        </View>
    );
});
