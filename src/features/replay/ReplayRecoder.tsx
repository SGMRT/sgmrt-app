// ReplayRecorder.tsx — base64 only + frame-locked + aggressive perf tuning
// - tmpfile 완전 제거 (실기기/시뮬레이터 공통 base64)
// - "캡처 → 성공 시 한 프레임 전진(stepForward) → 다음 캡처" 고정 루프 (프레임 스킵 없음)
// - 캡처 시간/메모리 예산 기반 품질만 동적 조절
// - AppState/레코딩 가드로 루프 유출 방지, micro-yield로 메인스레드 숨통

import { createVideoFromBase64 } from "@/modules/expo-image-to-video";
import { Telemetry } from "@/src/apis/types/run";
import StatRow, { Stat } from "@/src/components/ui/StatRow";
import { showToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import { interpolateTelemetries } from "@/src/utils/interpolateTelemetries";
import { normalizeTimestamps } from "@/src/utils/normalizeTimestamps";
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
        visualFps = 22,
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
        base64BytesBudget = 120 * 1024 * 1024,
        captureTargetWidth = 393,
    },
    ref
) {
    if (Platform.OS !== "ios") {
        console.warn(`${TAG} Tuned for iOS, but works cross-platform base64.`);
    }

    const cameraRef = useRef<Camera | null>(null);
    const viewShotRef = useRef<ViewShot | null>(null);

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
        state,
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

    type TimeoutId = ReturnType<typeof setTimeout>;
    const timerRef = useRef<TimeoutId | null>(null);

    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const microYield = () => new Promise((r) => setTimeout(r, 0));

    // 다운스케일 해상도
    const targetWidth = Math.max(128, Math.min(captureTargetWidth, 420));
    const targetHeight = Math.max(1, Math.round((targetWidth / 393) * 586));

    // 품질
    const currentQualityRef = useRef(0.15);
    const clampQ = (q: number) => Math.max(0.1, Math.min(0.2, q));

    // 유틸
    const combineFramesToVideo = useCallback(async (): Promise<
        string | null
    > => {
        const outputPath = `${
            FileSystem.documentDirectory
        }replay_${Date.now()}.mp4`;
        try {
            const frames = base64FramesRef.current;
            if (!frames.length) return null;
            const fps = replayVisualFps ?? visualFps;
            const result = await createVideoFromBase64(frames, outputPath, fps);
            return result.startsWith("file://") ? result : `file://${result}`;
        } catch (err) {
            return null;
        }
    }, [replayVisualFps, visualFps]);

    const resetBuffers = useCallback(() => {
        base64FramesRef.current = [];
        base64BytesRef.current = 0;
        indexRef.current = 0;
        currentQualityRef.current = 0.15;
    }, []);

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
        if (progress >= 1) {
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
                base64FramesRef.current.push(b64);
                base64BytesRef.current += roughBase64Bytes(b64);

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
        } catch {
            // 캡처 실패는 드물게 발생하므로 프레임은 전진 (부드러움 유지)
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
        progress,
        stepForward,
        base64BytesBudget,
    ]);

    // 수명주기/제어
    const startLoop = useCallback(async () => {
        resetBuffers();
        setRecording(true);
        recordingRef.current = true;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(frameLockedLoop, 0);
    }, [resetBuffers, frameLockedLoop]);

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
            if (s !== "active") stopLoop();
            else if (recording && !timerRef.current && recordingRef.current) {
                timerRef.current = setTimeout(frameLockedLoop, 0);
            }
        });
        return () => sub.remove();
    }, [recording, frameLockedLoop, stopLoop]);

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
                } catch {}
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
                }).catch((e) => {
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
                        }).catch((e) => {
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
                            captrueMode={true}
                        />
                    </View>

                    <StatRow
                        stats={stats?.slice(0, 4) ?? []}
                        style={{ marginLeft: 16, marginTop: 20, gap: 12 }}
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
