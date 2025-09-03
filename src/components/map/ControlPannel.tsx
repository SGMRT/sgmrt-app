import { LocateMe } from "@/assets/svgs/svgs";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

type TrackPhase = "idle" | "follow" | "heading";

interface ControlPannelProps {
    phase: TrackPhase;
    onToggleTracking: () => void;
    controlPannelPosition: any;
}

export default function ControlPannel({
    phase,
    onToggleTracking,
    controlPannelPosition,
}: ControlPannelProps) {
    const [lastPress, setLastPress] = useState(0);

    const onPress = useCallback(() => {
        const now = Date.now();
        if (now - lastPress > 1000) {
            // 1s 디바운스
            setLastPress(now);
            onToggleTracking();
        }
    }, [lastPress, onToggleTracking]);

    return (
        <Animated.View style={[styles.container, controlPannelPosition]}>
            <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
                <LocateMe />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 16.5,
        bottom: 16,
        height: 48,
        width: 48,
    },
    buttonContainer: {
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        borderRadius: 100,
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },
});
