// Ghost Runner Design System - Toggle Control

import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../themes";
import type { ControlVariantProps } from "../types";

const TOGGLE_WIDTH = 44;
const TOGGLE_HEIGHT = 24;
const TOGGLE_THUMB = 20;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TOGGLE_WIDTH - TOGGLE_THUMB - THUMB_OFFSET * 2;

export function Toggle({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();
    const progress = useSharedValue(status ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(status ? 1 : 0, { duration: 80 });
    }, [status, progress]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [theme.ui07, theme.primary],
        ),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: progress.value * THUMB_TRAVEL }],
    }));

    return (
        <Pressable onPress={onPress} disabled={disabled}>
            <Animated.View
                style={[
                    {
                        width: TOGGLE_WIDTH,
                        height: TOGGLE_HEIGHT,
                        borderRadius: TOGGLE_HEIGHT / 2,
                        justifyContent: "center",
                        paddingHorizontal: THUMB_OFFSET,
                        opacity: disabled ? 0.5 : 1,
                    },
                    trackStyle,
                ]}
            >
                <Animated.View
                    style={[
                        {
                            width: TOGGLE_THUMB,
                            height: TOGGLE_THUMB,
                            borderRadius: TOGGLE_THUMB / 2,
                            backgroundColor: theme.ui10,
                            boxShadow: theme.shadow01,
                        },
                        thumbStyle,
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}
