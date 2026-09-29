// Ghost Runner Design System - Radio Control

import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { CheckIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { duration, pressScale, spring } from "../../../tokens/motion";
import { SIZE, type ControlVariantProps } from "../types";
import { radius } from "@/src/design-system/tokens/radius";

export function Radio({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();
    const reduceMotion = useReducedMotion();

    const on = useSharedValue(status ? 1 : 0);
    const pressed = useSharedValue(0);

    useEffect(() => {
        on.value = reduceMotion
            ? withTiming(status ? 1 : 0, { duration: duration.fast })
            : withSpring(status ? 1 : 0, spring.toggle);
    }, [status, reduceMotion, on]);

    const press = (to: number) => {
        if (disabled || reduceMotion) return;
        pressed.value =
            to === 1
                ? withTiming(1, { duration: duration.press })
                : withSpring(0, spring.press);
    };

    const circleStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            on.value,
            [0, 1],
            // 꺼짐 배경은 안에 놓이는 흰 체크와 충분히 벌어져야 한다.
            // 한 단계만 낮추면 마크가 배경에 묻힌다.
            [theme.ui05, theme.primary]
        ),
        transform: [{ scale: 1 - pressed.value * (1 - pressScale.compact) }],
    }));

    // 체크 마크는 켜질 때 함께 부풀어 오른다. 배경만 바뀌면 밋밋하다.
    const markScale = useDerivedValue(() => 0.86 + on.value * 0.14);
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: markScale.value }],
    }));
    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => press(1)}
            onPressOut={() => press(0)}
            disabled={disabled}
            hitSlop={8}
        >
            <Animated.View
                style={[
                    {
                        width: SIZE,
                        height: SIZE,
                        borderRadius: radius.full,
                        alignItems: "center",
                        justifyContent: "center",
                    },
                    circleStyle,
                    disabled ? { backgroundColor: theme.uiDisabled } : null,
                ]}
            >
                <Animated.View style={iconStyle}>
                    <CheckIcon
                        width={20}
                        height={20}
                        color={
                            disabled
                                ? theme.uiDisabledFg
                                : status
                                  ? theme.ui01
                                  : theme.ui10
                        }
                    />
                </Animated.View>
            </Animated.View>
        </Pressable>
    );
}
