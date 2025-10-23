import colors from "@/src/theme/colors";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        progressWidth.value = withTiming(progress * 100, { duration: 1000 });
    }, [progress]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[styles.progress, { width: progressWidth }]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 8,
        borderRadius: 20,
        backgroundColor: "#333333",
        overflow: "hidden",
    },
    progress: {
        height: 8,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
});
