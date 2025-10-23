import colors from "@/src/theme/colors";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        const clamped = Math.max(0, Math.min(1, progress));
        progressWidth.value = withTiming(clamped * 100, { duration: 1000 });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value}%`,
        };
    });

    return (
        <View
            style={styles.container}
            accessibilityRole="progressbar"
            accessibilityValue={{
                min: 0,
                max: 100,
                now: progressWidth.value,
            }}
        >
            <Animated.View style={[styles.progress, animatedStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
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
