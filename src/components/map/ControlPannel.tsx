import { Compass, LocateMe } from "@/assets/svgs/svgs";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface ControlPannelProps {
    onClickCompass: () => void;
    onClickLocateMe: () => void;
    controlPannelPosition: any;
}

export default function ControlPannel({
    onClickCompass,
    onClickLocateMe,
    controlPannelPosition,
}: ControlPannelProps) {
    const [debouncedCompass, setDebouncedCompass] = useState(Date.now());
    const [debouncedLocateMe, setDebouncedLocateMe] = useState(Date.now());

    const debouncedOnClickCompass = useCallback(() => {
        if (Date.now() - debouncedCompass > 2000) {
            setDebouncedCompass(Date.now());
            onClickCompass();
        }
    }, [debouncedCompass, onClickCompass]);

    const debouncedOnClickLocateMe = useCallback(() => {
        if (Date.now() - debouncedLocateMe > 2000) {
            setDebouncedLocateMe(Date.now());
            onClickLocateMe();
        }
    }, [debouncedLocateMe, onClickLocateMe]);

    return (
        <Animated.View style={[styles.container, controlPannelPosition]}>
            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={debouncedOnClickCompass}
            >
                <Compass />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={debouncedOnClickLocateMe}
            >
                <LocateMe />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 17,
        gap: 8,
        bottom: 16,
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
