import { Compass, LocateMe } from "@/assets/svgs/svgs";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ControlPannelProps {
    onClickCompass: () => void;
    onClickLocateMe: () => void;
}

export default function ControlPannel({
    onClickCompass,
    onClickLocateMe,
}: ControlPannelProps) {
    return (
        <View style={styles.container}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 16,
        left: 17,
        gap: 8,
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
