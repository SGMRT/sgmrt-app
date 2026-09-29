// Ghost Runner Design System - Check Control

import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { CheckIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { duration, pressScale, spring } from "../../../tokens/motion";
import { SIZE, type ControlVariantProps } from "../types";

export function Check({ status, disabled, onPress }: ControlVariantProps) {
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

    // 면이 없는 변형이라 크기 변화로만 상태를 보탠다.
    // 색이 주된 신호이고 움직임은 거들기만 한다.
    const style = useAnimatedStyle(() => ({
        transform: [
            { scale: (0.88 + on.value * 0.12) * (1 - pressed.value * (1 - pressScale.compact)) },
        ],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => press(1)}
            onPressOut={() => press(0)}
            disabled={disabled}
            hitSlop={8}
        >
            <Animated.View style={style}>
                <CheckIcon
                    width={SIZE}
                    height={SIZE}
                    color={
                        disabled
                            ? theme.uiDisabledFg
                            : status
                              ? theme.primary
                              : theme.ui06
                    }
                />
            </Animated.View>
        </Pressable>
    );
}
