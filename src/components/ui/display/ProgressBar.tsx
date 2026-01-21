// ProgressBar.tsx
import colors from "@/src/theme/colors";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
    progress: number;
    onChange?: (p: number) => void;
    onCommit?: (p: number) => void;
    backgroundColor?: string;
    duration?: number;
    controller?: boolean;
    interactive?: boolean;
}

export const ProgressBar = ({
    progress,
    onChange,
    onCommit,
    backgroundColor = "#333333",
    duration = 300,
    controller = true,
    interactive = true,
}: ProgressBarProps) => {
    const [barWidth, setBarWidth] = useState(0);
    const onLayout = (e: LayoutChangeEvent) => {
        setBarWidth(e.nativeEvent.layout.width);
    };

    const pct = useSharedValue(0);

    const accNow = useMemo(() => {
        const clamped = Number.isFinite(progress)
            ? Math.max(0, Math.min(1, progress))
            : 0;
        return Math.round(clamped * 100);
    }, [progress]);

    useEffect(() => {
        const clamped = Number.isFinite(progress)
            ? Math.max(0, Math.min(1, progress))
            : 0;
        pct.value = withTiming(clamped * 100, { duration });
    }, [progress, duration]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${pct.value}%`,
    }));

    const controllerRadius = 8.5; // 17px / 2
    const controllerStyle = useAnimatedStyle(() => {
        if (barWidth <= 0) return {};
        const x = (pct.value / 100) * barWidth - controllerRadius;
        return { transform: [{ translateX: x }] };
    });

    const pan = Gesture.Pan()
        .enabled(interactive)
        .onBegin((e) => {
            if (barWidth <= 0) return;
            const x = Math.max(0, Math.min(barWidth, e.x));
            const p01 = x / barWidth;
            pct.value = p01 * 100;
            if (onChange) runOnJS(onChange)(p01);
        })
        .onChange((e) => {
            if (barWidth <= 0) return;
            const x = Math.max(0, Math.min(barWidth, e.x));
            const p01 = x / barWidth;
            pct.value = p01 * 100;
            if (onChange) runOnJS(onChange)(p01);
        })
        .onEnd((e) => {
            if (barWidth <= 0) return;
            const x = Math.max(0, Math.min(barWidth, e.x));
            const p01 = x / barWidth;
            pct.value = withTiming(p01 * 100, {
                duration: Math.min(200, duration),
            });
            if (onCommit) runOnJS(onCommit)(p01);
        });

    return (
        <GestureDetector gesture={pan}>
            <View
                onLayout={onLayout}
                style={[styles.container, { backgroundColor }]}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: accNow }}
            >
                {/* 진행 바 */}
                <Animated.View style={[styles.progress, barStyle]} />
                {/* 컨트롤러 (원) */}
                {controller && barWidth > 0 && (
                    <Animated.View
                        style={[styles.controller, controllerStyle]}
                    />
                )}
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 8,
        borderRadius: 20,
        overflow: "visible",
    },
    progress: {
        height: "100%",
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
    controller: {
        width: 17,
        height: 17,
        borderRadius: 100,
        backgroundColor: colors.primary,
        position: "absolute",
        top: -4.5,
    },
});
