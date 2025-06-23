import { Compass, LocateMe } from "@/assets/svgs/svgs";
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
    return (
        <Animated.View style={[styles.container, controlPannelPosition]}>
            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={onClickCompass}
            >
                <Compass />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={onClickLocateMe}
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
