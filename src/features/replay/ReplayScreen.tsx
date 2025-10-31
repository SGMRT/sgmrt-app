import { createVideo } from "@/modules/expo-image-to-video";
import { Typography } from "@/src/components/ui/Typography";
import { Camera } from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system";
import { SplashScreen } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import dummyData from "./dummy.json";
import { useReplay } from "./hooks/useReplay";
import ReplayMap from "./ReplayMap";
import { Sample } from "./types";

const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={{
            backgroundColor: "#222",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#444",
            marginRight: 8,
        }}
    >
        <Text style={{ color: "white", fontWeight: "600" }}>{label}</Text>
    </Pressable>
);

export default function ReplayScreen() {
    SplashScreen.hideAsync();
    const cameraRef = useRef<Camera | null>(null);
    const viewShotRef = useRef<ViewShot>(null);
    const data = useMemo<Sample[]>(() => dummyData as Sample[], []);
    const {
        state,
        progress,
        position,
        play,
        pause,
        reset,
        stats,
        durationMs,
        stepForward,
        stepBackward,
    } = useReplay(1, data, {});

    const capturedUrisRef = useRef<string[]>([]);

    const frameDir = `${FileSystem.cacheDirectory}replay-frames/`;
    const indexRef = useRef(0);

    const initFrameDir = useCallback(async () => {
        try {
            await FileSystem.deleteAsync(frameDir, { idempotent: true });
            await FileSystem.makeDirectoryAsync(frameDir, {
                intermediates: true,
            });
        } catch (e) {
            console.log("init frameDir error", e);
        }
    }, [frameDir]);

    // 시작 시 프레임 폴더 초기화
    useEffect(() => {
        void initFrameDir();
    }, [initFrameDir]);

    function normalizePath(p: string) {
        // file:/// → / 로 통일
        return p.startsWith("file://") ? p.replace("file://", "") : p;
    }

    async function persistFrame(uri: string) {
        try {
            const idx = indexRef.current++;
            const name = `frame_${String(idx).padStart(6, "0")}.jpg`;
            const dest = `${frameDir}${name}`;

            // 캡처 원본이 tmp이면, 안전한 캐시로 복사
            await FileSystem.copyAsync({ from: uri, to: dest });

            // 복사된 경로만 네이티브로 넘김 (스킴 제거)
            const normalized = normalizePath(dest);
            capturedUrisRef.current.push(normalized);

            if (idx % 100 === 0) {
                console.log("persisted", normalized, idx);
            }
        } catch (e) {
            console.log("persistFrame error", e);
        }
    }

    async function combineFramesToVideo() {
        // 존재 검증
        const existsFlags = await Promise.all(
            capturedUrisRef.current.map(async (p) => {
                try {
                    const info = await FileSystem.getInfoAsync(`file://${p}`);
                    return info.exists && (info.size ?? 0) > 0;
                } catch {
                    return false;
                }
            })
        );

        const validPaths = capturedUrisRef.current.filter(
            (_, i) => existsFlags[i]
        );

        console.log(
            "frames:",
            capturedUrisRef.current.length,
            "valid:",
            validPaths.length
        );
        if (validPaths.length === 0) {
            console.log("No frames to encode");
            return;
        }

        const outputPath = `${FileSystem.cacheDirectory}replay.mp4`;
        try {
            console.log("start createVideo");
            console.log(validPaths[0]);
            const result = await createVideo(validPaths, outputPath, 24);
            console.log("createVideo result", result);
            await Share.open({
                url: result,
                title: "Replay",
                message: "Replay",
                filename: "replay.mp4",
            });
        } catch (err) {
            console.log(err);
        }
    }

    const onPressPlay = useCallback(async () => {
        await initFrameDir();
        play();
    }, [play, initFrameDir]);

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <Typography variant="headline" color="white" style={{ margin: 12 }}>
                Replay
            </Typography>

            <ViewShot
                ref={viewShotRef}
                options={{
                    format: "jpg",
                    quality: 0.9,
                    result: "tmpfile",
                }}
                captureMode="update"
                onCapture={(uri) => {
                    void persistFrame(uri);
                }}
            >
                <ReplayMap
                    data={data}
                    stats={stats}
                    lng={position.x}
                    lat={position.y}
                    progress={Math.max(0, Math.min(1, progress))}
                    heading={position.heading}
                    cameraRef={cameraRef}
                />
            </ViewShot>

            <View
                style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 20,
                }}
            >
                <Text style={{ color: "white", marginBottom: 8 }}>
                    {state.toUpperCase()} • {(progress * 100).toFixed(0)}% •{" "}
                    {(durationMs / 1000).toFixed(1)}s
                </Text>
                <View style={{ flexDirection: "row" }}>
                    {state !== "playing" ? (
                        <Btn onPress={onPressPlay} label="▶︎ Play" />
                    ) : (
                        <Btn onPress={pause} label="⏸ Pause" />
                    )}
                    {state !== "playing" && (
                        <Btn onPress={stepBackward} label="◀" />
                    )}
                    {state !== "playing" && (
                        <Btn onPress={stepForward} label="▶" />
                    )}
                    <Btn onPress={combineFramesToVideo} label="CtV" />
                    <Btn onPress={reset} label="R" />
                </View>
            </View>
        </View>
    );
}
