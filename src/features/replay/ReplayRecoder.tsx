// ReplayRecorder.tsx — base64 only + frame-locked + aggressive perf tuning
// - tmpfile 완전 제거 (실기기/시뮬레이터 공통 base64)
// - "캡처 → 성공 시 한 프레임 전진(stepForward) → 다음 캡처" 고정 루프 (프레임 스킵 없음)
// - 캡처 시간/메모리 예산 기반 품질만 동적 조절
// - AppState/레코딩 가드로 루프 유출 방지, micro-yield로 메인스레드 숨통

import { createVideoFromBase64 } from "@/modules/expo-image-to-video";
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
    distance?: string | number; // km
    onProgress?: (progress: number) => void;
    onFinish?: () => void;

    base64BytesBudget?: number;
    captureTargetWidth?: number;
};

const TAG = "[ReplayRecorder/Base64]";
const roughBase64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4);

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
        base64BytesBudget: budgetProp,
        captureTargetWidth: widthProp,
    },
    ref
) {
    // 기기별 최적화된 설정 적용
    const config = useMemo(() => getRecordingConfig(), []);
    const visualFps = visualFpsProp ?? config.visualFps;
    const base64BytesBudget = budgetProp ?? config.base64BytesBudget;
    const captureTargetWidth = widthProp ?? config.targetWidth;

    if (Platform.OS !== "ios") {
        console.warn(`${TAG} Tuned for iOS, but works cross-platform base64.`);
    }

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
        stepForward, // 한 프레임 전진
        frameMs, // 한 프레임의 논리 시간
        visualFps: replayVisualFps,
    } = useReplay(Number(distance ?? 0) * 1000, samples, { visualFps });

    // 상태/레퍼런스
    const recordingRef = useRef(false);
    const [recording, setRecording] = useState(false);

    const base64FramesRef = useRef<string[]>([]);
    const base64BytesRef = useRef(0);
    const indexRef = useRef(0);

    // progress를 ref로 추적하여 콜백 의존성 안정화
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

    // 유틸
    const combineFramesToVideo = useCallback(async (): Promise<
        string | null
    > => {
        const outputPath = `${
            FileSystem.documentDirectory
        }replay_${Date.now()}.mp4`;

        const timer = trackDuration("replay.combineFramesToVideo", {
            frameCount: base64FramesRef.current.length,
            totalBytes: base64BytesRef.current,
            quality: currentQualityRef.current,
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
            addPhase("replay.encoding_start", {
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
                "replay.combineFramesToVideo",
                err,
                {
                    frameCount: base64FramesRef.current.length,
                    totalBytes: base64BytesRef.current,
                    quality: currentQualityRef.current,
                    platform: Platform.OS,
                },
                { feature: "replay-video" },
                ERROR_PRIORITY.HIGH
            );
            return null;
        }
    }, [replayVisualFps, visualFps, metrics]);

    const resetBuffers = useCallback(() => {
        base64FramesRef.current = [];
        base64BytesRef.current = 0;
        indexRef.current = 0;
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
                const frameBytes = roughBase64Bytes(b64);
                base64FramesRef.current.push(b64);
                base64BytesRef.current += frameBytes;

                // 캡처 메트릭 기록
                const captureTime = Date.now() - started;
                metrics.recordCapture(captureTime, base64BytesRef.current);

                // 메모리 예산 초과 시, 프레임은 유지하고 품질만 내림
                if (base64BytesRef.current > base64BytesBudget) {
                    currentQualityRef.current = clampQ(
                        currentQualityRef.current - 0.02
                    );
                    // 추정치 감소(이미 쌓인 프레임은 줄일 수 없으므로 속도 개선만)
                    base64BytesRef.current = Math.floor(
                        base64BytesRef.current * 0.9
                    );
                }

                indexRef.current++;
            }
        } catch (err) {
            // 캡처 실패는 드물게 발생하므로 프레임은 전진 (부드러움 유지)
            // 단, 에러는 Sentry에 기록하여 패턴 파악
            metrics.recordDrop();
            captureError(
                "replay.frameCapture",
                err,
                {
                    frameIndex: indexRef.current,
                    quality: currentQualityRef.current,
                    memoryUsage: base64BytesRef.current,
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

        // 3) 다음 프레임으로 "한 프레임" 전진
        stepForward();

        // 4) 다음 사이클 예약
        if (recordingRef.current) {
            // 캡처가 너무 빨랐다면 아주 소량 대기(1~2ms)로 스케줄 양보
            const bleed = elapsed < 4 ? 1 : 0;
            timerRef.current = setTimeout(frameLockedLoop, bleed);
        }
    }, [
        targetWidth,
        targetHeight,
        frameMs,
        stepForward,
        base64BytesBudget,
        metrics,
    ]);

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

            // 프레임 0장 방지
            if (indexRef.current === 0 && viewShotRef.current) {
                try {
                    const uri = await captureRef(viewShotRef, {
                        format: "jpg",
                        result: "base64",
                        quality: currentQualityRef.current,
                        width: targetWidth,
                        height: targetHeight,
                    });
                    if (uri) {
                        const b64 = uri as string;
                        base64FramesRef.current.push(b64);
                        base64BytesRef.current += roughBase64Bytes(b64);
                    }
                } catch (err) {
                    captureError(
                        "replay.fallbackCapture",
                        err,
                        {
                            quality: currentQualityRef.current,
                            targetWidth,
                            targetHeight,
                        },
                        { feature: "replay-video" },
                        ERROR_PRIORITY.MEDIUM
                    );
                }
            }

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

    // 뷰
    return (
        <View style={{ position: "absolute", zIndex: -1000, top: 200 }}>
            <ViewShot
                ref={viewShotRef}
                options={{
                    format: "jpg",
                    result: "base64",
                    quality: 0.15, // 초기값
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
