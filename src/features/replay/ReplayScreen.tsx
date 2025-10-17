import { Typography } from "@/src/components/ui/Typography";
import { Camera } from "@rnmapbox/maps";
import { SplashScreen } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import dummyData from "./dummy.json";
import { useReplay, type Sample } from "./hooks/useReplay";
import ReplayMap from "./ReplayMap";

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
    const data = useMemo<Sample[]>(() => dummyData as Sample[], []);
    const { state, progress, position, play, pause, reset, durationMs } =
        useReplay(data);

    const playWithCamera = useCallback(() => {
        cameraRef.current?.setCamera({
            centerCoordinate: [position.x, position.y],
            zoomLevel: 16,
            pitch: 65,
            heading: position.heading,
        });

        play();
    }, [play, position]);

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <Typography variant="headline" color="white" style={{ margin: 12 }}>
                Replay
            </Typography>

            <ReplayMap
                data={data}
                lng={position.x}
                lat={position.y}
                progress={Math.max(0, Math.min(1, progress))}
                heading={position.heading}
                cameraRef={cameraRef}
            />

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
                        <Btn onPress={playWithCamera} label="▶︎ Play" />
                    ) : (
                        <Btn onPress={pause} label="⏸ Pause" />
                    )}
                    <Btn onPress={reset} label="⟲ Reset" />
                </View>
            </View>
        </View>
    );
}
