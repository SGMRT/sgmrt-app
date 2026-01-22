/**
 * ViewShot vs Skia 캡처 성능 비교 벤치마크
 *
 * 동일한 콘텐츠를 두 가지 방식으로 캡처하여 성능 비교
 */

import { createVideoFromBase64 } from "@/modules/expo-image-to-video";
import {
    Canvas,
    Circle,
    Path,
    Skia,
    Text as SkiaText,
    useCanvasRef,
    useFont,
} from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";
import { useCallback, useRef, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";

type BenchmarkResult = {
    method: "ViewShot" | "Skia";
    totalFrames: number;
    captureTimeMs: number;
    encodeTimeMs: number;
    avgCapturePerFrameMs: number;
    fileSizeBytes: number;
    success: boolean;
};

const CANVAS_WIDTH = 393;
const CANVAS_HEIGHT = 586;
const TARGET_FPS = 24;
const DURATION_SEC = 3;
const TOTAL_FRAMES = TARGET_FPS * DURATION_SEC;

export default function SkiaVideoTest() {
    const canvasRef = useCanvasRef();
    const viewShotRef = useRef<ViewShot>(null);

    const [results, setResults] = useState<BenchmarkResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentTest, setCurrentTest] = useState<string>("");
    const [progress, setProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);

    const font = useFont(
        require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
        24
    );

    // ViewShot 벤치마크
    const runViewShotBenchmark = useCallback(async (): Promise<BenchmarkResult> => {
        const frames: string[] = [];
        const captureStart = Date.now();

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            setCurrentFrame(i);
            setProgress((i + 1) / TOTAL_FRAMES);

            // React 렌더링 대기
            await new Promise((r) => setTimeout(r, 0));

            try {
                const uri = await captureRef(viewShotRef, {
                    format: "jpg",
                    quality: 0.15,
                    result: "base64",
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                });

                if (uri) {
                    frames.push(uri as string);
                }
            } catch (err) {
                console.warn(`[ViewShot] Frame ${i} failed:`, err);
            }
        }

        const captureTimeMs = Date.now() - captureStart;

        // 인코딩
        const outputPath = `${FileSystem.documentDirectory}viewshot_test_${Date.now()}.mp4`;
        const encodeStart = Date.now();
        let fileSizeBytes = 0;
        let success = false;

        try {
            const result = await createVideoFromBase64(frames, outputPath, TARGET_FPS);
            const info = await FileSystem.getInfoAsync(result.replace("file://", ""));
            if (info.exists && "size" in info) {
                fileSizeBytes = info.size ?? 0;
            }
            success = true;
        } catch (err) {
            console.error("[ViewShot] Encoding failed:", err);
        }

        const encodeTimeMs = Date.now() - encodeStart;

        return {
            method: "ViewShot",
            totalFrames: frames.length,
            captureTimeMs,
            encodeTimeMs,
            avgCapturePerFrameMs: frames.length > 0 ? captureTimeMs / frames.length : 0,
            fileSizeBytes,
            success,
        };
    }, []);

    // Skia 벤치마크
    const runSkiaBenchmark = useCallback(async (): Promise<BenchmarkResult> => {
        if (!canvasRef.current) {
            return {
                method: "Skia",
                totalFrames: 0,
                captureTimeMs: 0,
                encodeTimeMs: 0,
                avgCapturePerFrameMs: 0,
                fileSizeBytes: 0,
                success: false,
            };
        }

        const frames: string[] = [];
        const captureStart = Date.now();

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            setCurrentFrame(i);
            setProgress((i + 1) / TOTAL_FRAMES);

            // React 렌더링 대기
            await new Promise((r) => setTimeout(r, 0));

            try {
                const image = await canvasRef.current.makeImageSnapshotAsync();
                if (image) {
                    const bytes = image.encodeToBytes();
                    if (bytes) {
                        const base64 = uint8ArrayToBase64(bytes);
                        frames.push(base64);
                    }
                }
            } catch (err) {
                console.warn(`[Skia] Frame ${i} failed:`, err);
            }
        }

        const captureTimeMs = Date.now() - captureStart;

        // 인코딩
        const outputPath = `${FileSystem.documentDirectory}skia_test_${Date.now()}.mp4`;
        const encodeStart = Date.now();
        let fileSizeBytes = 0;
        let success = false;

        try {
            const result = await createVideoFromBase64(frames, outputPath, TARGET_FPS);
            const info = await FileSystem.getInfoAsync(result.replace("file://", ""));
            if (info.exists && "size" in info) {
                fileSizeBytes = info.size ?? 0;
            }
            success = true;
        } catch (err) {
            console.error("[Skia] Encoding failed:", err);
        }

        const encodeTimeMs = Date.now() - encodeStart;

        return {
            method: "Skia",
            totalFrames: frames.length,
            captureTimeMs,
            encodeTimeMs,
            avgCapturePerFrameMs: frames.length > 0 ? captureTimeMs / frames.length : 0,
            fileSizeBytes,
            success,
        };
    }, []);

    // 전체 벤치마크 실행
    const runFullBenchmark = useCallback(async () => {
        setIsRunning(true);
        setResults([]);
        setCurrentFrame(0);

        // ViewShot 테스트
        setCurrentTest("ViewShot");
        setProgress(0);
        const viewShotResult = await runViewShotBenchmark();

        // 잠시 대기 (메모리 정리)
        await new Promise((r) => setTimeout(r, 500));

        // Skia 테스트
        setCurrentTest("Skia");
        setProgress(0);
        const skiaResult = await runSkiaBenchmark();

        setResults([viewShotResult, skiaResult]);
        setIsRunning(false);
        setCurrentTest("");
        setCurrentFrame(0);
    }, [runViewShotBenchmark, runSkiaBenchmark]);

    // 애니메이션 계산
    const t = currentFrame / TOTAL_FRAMES;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const orbitRadius = 100;
    const angle = t * Math.PI * 2;
    const circleX = centerX + Math.cos(angle) * orbitRadius;
    const circleY = centerY + Math.sin(angle) * orbitRadius;

    const arcPath = Skia.Path.Make();
    if (t > 0) {
        arcPath.addArc(
            {
                x: centerX - orbitRadius,
                y: centerY - orbitRadius,
                width: orbitRadius * 2,
                height: orbitRadius * 2,
            },
            0,
            t * 360
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>ViewShot vs Skia 벤치마크</Text>

            {/* 두 캔버스를 나란히 배치 */}
            <View style={styles.canvasRow}>
                {/* ViewShot 캔버스 */}
                <View style={styles.canvasWrapper}>
                    <Text style={styles.canvasLabel}>ViewShot</Text>
                    <ViewShot
                        ref={viewShotRef}
                        options={{ format: "jpg", quality: 0.15 }}
                    >
                        <View style={styles.canvasSmall}>
                            {/* 궤도 */}
                            <View style={[styles.orbit, { width: orbitRadius * 2, height: orbitRadius * 2 }]} />
                            {/* 움직이는 원 */}
                            <View
                                style={[
                                    styles.movingCircle,
                                    {
                                        left: circleX - 20,
                                        top: circleY - 20,
                                    },
                                ]}
                            />
                            {/* 중앙 점 */}
                            <View style={styles.centerDot} />
                            {/* 프레임 정보 */}
                            <Text style={styles.frameText}>
                                Frame: {currentFrame + 1}/{TOTAL_FRAMES}
                            </Text>
                        </View>
                    </ViewShot>
                </View>

                {/* Skia 캔버스 */}
                <View style={styles.canvasWrapper}>
                    <Text style={styles.canvasLabel}>Skia</Text>
                    <Canvas ref={canvasRef} style={styles.canvasSmall}>
                        <Circle
                            cx={centerX / 2}
                            cy={centerY / 2}
                            r={orbitRadius / 2}
                            color="#333333"
                            style="stroke"
                            strokeWidth={1}
                        />
                        <Circle
                            cx={circleX / 2}
                            cy={circleY / 2}
                            r={10}
                            color="#2196F3"
                        />
                        <Circle
                            cx={centerX / 2}
                            cy={centerY / 2}
                            r={3}
                            color="#FF5722"
                        />
                        {font && (
                            <SkiaText
                                x={10}
                                y={20}
                                text={`Frame: ${currentFrame + 1}/${TOTAL_FRAMES}`}
                                font={font}
                                color="#ffffff"
                            />
                        )}
                    </Canvas>
                </View>
            </View>

            {/* 컨트롤 */}
            <View style={styles.controls}>
                <Button
                    title={
                        isRunning
                            ? `${currentTest} 테스트 중... ${Math.round(progress * 100)}%`
                            : "벤치마크 시작 (ViewShot → Skia)"
                    }
                    onPress={runFullBenchmark}
                    disabled={isRunning}
                />
            </View>

            {/* 결과 비교 */}
            {results.length === 2 && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>비교 결과</Text>

                    <View style={styles.comparisonTable}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>항목</Text>
                            <Text style={styles.tableHeaderCell}>ViewShot</Text>
                            <Text style={styles.tableHeaderCell}>Skia</Text>
                            <Text style={styles.tableHeaderCell}>승자</Text>
                        </View>

                        <ComparisonRow
                            label="총 프레임"
                            viewShot={results[0].totalFrames}
                            skia={results[1].totalFrames}
                            unit=""
                            lowerIsBetter={false}
                        />
                        <ComparisonRow
                            label="캡처 시간"
                            viewShot={results[0].captureTimeMs}
                            skia={results[1].captureTimeMs}
                            unit="ms"
                            lowerIsBetter={true}
                        />
                        <ComparisonRow
                            label="평균 캡처"
                            viewShot={results[0].avgCapturePerFrameMs}
                            skia={results[1].avgCapturePerFrameMs}
                            unit="ms/f"
                            lowerIsBetter={true}
                            decimals={1}
                        />
                        <ComparisonRow
                            label="인코딩"
                            viewShot={results[0].encodeTimeMs}
                            skia={results[1].encodeTimeMs}
                            unit="ms"
                            lowerIsBetter={true}
                        />
                        <ComparisonRow
                            label="파일 크기"
                            viewShot={results[0].fileSizeBytes / 1024}
                            skia={results[1].fileSizeBytes / 1024}
                            unit="KB"
                            lowerIsBetter={true}
                            decimals={1}
                        />
                    </View>

                    {/* 총평 */}
                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>총평</Text>
                        <Text style={styles.summaryText}>
                            캡처 속도: {results[0].avgCapturePerFrameMs < results[1].avgCapturePerFrameMs
                                ? `ViewShot이 ${((results[1].avgCapturePerFrameMs / results[0].avgCapturePerFrameMs - 1) * 100).toFixed(0)}% 빠름`
                                : `Skia가 ${((results[0].avgCapturePerFrameMs / results[1].avgCapturePerFrameMs - 1) * 100).toFixed(0)}% 빠름`
                            }
                        </Text>
                        <Text style={styles.summaryText}>
                            총 소요: ViewShot {results[0].captureTimeMs + results[0].encodeTimeMs}ms vs Skia {results[1].captureTimeMs + results[1].encodeTimeMs}ms
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    설정: {CANVAS_WIDTH}x{CANVAS_HEIGHT}, {TARGET_FPS}fps, {DURATION_SEC}초, 72프레임
                </Text>
            </View>
        </ScrollView>
    );
}

function ComparisonRow({
    label,
    viewShot,
    skia,
    unit,
    lowerIsBetter,
    decimals = 0,
}: {
    label: string;
    viewShot: number;
    skia: number;
    unit: string;
    lowerIsBetter: boolean;
    decimals?: number;
}) {
    const viewShotWins = lowerIsBetter ? viewShot < skia : viewShot > skia;
    const skiaWins = lowerIsBetter ? skia < viewShot : skia > viewShot;
    const tie = viewShot === skia;

    return (
        <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{label}</Text>
            <Text style={[styles.tableCell, viewShotWins && styles.winner]}>
                {viewShot.toFixed(decimals)}{unit}
            </Text>
            <Text style={[styles.tableCell, skiaWins && styles.winner]}>
                {skia.toFixed(decimals)}{unit}
            </Text>
            <Text style={styles.tableCell}>
                {tie ? "무승부" : viewShotWins ? "ViewShot" : "Skia"}
            </Text>
        </View>
    );
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 16,
    },
    canvasRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
    },
    canvasWrapper: {
        alignItems: "center",
    },
    canvasLabel: {
        fontSize: 14,
        color: "#888",
        marginBottom: 8,
    },
    canvasSmall: {
        width: CANVAS_WIDTH / 2,
        height: CANVAS_HEIGHT / 2,
        backgroundColor: "#1a1a1a",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    orbit: {
        position: "absolute",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 100,
    },
    movingCircle: {
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2196F3",
    },
    centerDot: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#FF5722",
        left: CANVAS_WIDTH / 4 - 5,
        top: CANVAS_HEIGHT / 4 - 5,
    },
    frameText: {
        position: "absolute",
        top: 10,
        left: 10,
        color: "#fff",
        fontSize: 12,
    },
    controls: {
        marginBottom: 16,
    },
    resultsContainer: {
        backgroundColor: "#1a1a1a",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
        marginBottom: 12,
        textAlign: "center",
    },
    comparisonTable: {
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 4,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#333",
        paddingVertical: 8,
    },
    tableHeaderCell: {
        flex: 1,
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 12,
    },
    tableRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#333",
        paddingVertical: 8,
    },
    tableCell: {
        flex: 1,
        color: "#ccc",
        textAlign: "center",
        fontSize: 12,
    },
    winner: {
        color: "#4CAF50",
        fontWeight: "bold",
    },
    summary: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#222",
        borderRadius: 4,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FF9800",
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 12,
        color: "#aaa",
        marginBottom: 4,
    },
    infoContainer: {
        padding: 8,
        marginBottom: 32,
    },
    infoText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
});
