// Ghost Runner Design System - Toggle Control

import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../themes";
import { spring } from "../../../tokens/motion";
import type { ControlVariantProps } from "../types";
import { radius } from "@/src/design-system/tokens/radius";

const TOGGLE_WIDTH = 44;
const TOGGLE_HEIGHT = 24;
const TOGGLE_THUMB = 20;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TOGGLE_WIDTH - TOGGLE_THUMB - THUMB_OFFSET * 2;

export function Toggle({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();
    const progress = useSharedValue(status ? 1 : 0);

    useEffect(() => {
        progress.value = withSpring(status ? 1 : 0, spring.toggle);
    }, [status, progress]);

    // 꺼짐은 ui03 이다. 예전에는 ui07 이라 거의 흰색으로 읽혀
    // 꺼져 있는데도 켜진 것처럼 보였다.
    // 체크의 꺼짐(ui02)과 같은 어두운 대역에 두어 둘이 서로 어울리게 한다.
    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [theme.ui03, theme.primary],
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
                        borderRadius: radius.full,
                        justifyContent: "center",
                        paddingHorizontal: THUMB_OFFSET,
                    },
                    trackStyle,
                    // 못 누르는 상태는 켜짐과 꺼짐을 가리지 않고 같은 면이 된다.
                    // 이때는 값보다 누를 수 없다는 사실이 먼저 읽혀야 한다.
                    disabled ? { backgroundColor: theme.uiDisabled } : null,
                ]}
            >
                <Animated.View
                    style={[
                        {
                            width: TOGGLE_THUMB,
                            height: TOGGLE_THUMB,
                            borderRadius: radius.full,
                            backgroundColor: disabled
                                ? theme.uiDisabledFg
                                : theme.ui10,
                            boxShadow: disabled ? undefined : theme.shadow01,
                        },
                        thumbStyle,
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}
