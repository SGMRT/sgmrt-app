import {
    onHeartRate,
    onWatchState,
    pause,
    resume,
    start,
    stop,
} from "@/modules/expo-watch-module";
import { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";

export default function HeartRateScreen() {
    const [bpm, setBpm] = useState<number | null>(null);
    const subHR = useRef<{ remove: () => void } | null>(null);

    useEffect(() => {
        subHR.current = onHeartRate((bpm) => {
            setBpm(bpm);
        });
        return () => {
            subHR.current?.remove();
        };
    }, []);

    return (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
            }}
        >
            <Button title="Start" onPress={start} />
            <Button title="Pause" onPress={pause} />
            <Button title="Resume" onPress={resume} />
            <Button title="Stop" onPress={stop} />
            <Text style={{ fontSize: 22 }}>
                {bpm ? `❤️ ${Math.round(bpm)} bpm` : "Waiting for BPM…"}
            </Text>
        </View>
    );
}
