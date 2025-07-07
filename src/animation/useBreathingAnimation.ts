// useBreathingAnimation.ts
import { useEffect } from "react";
import {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

export function useBreathingAnimation() {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.05, { duration: 1000 }), // 커짐
            -1,
            true // 반복할 때 반대 방향으로 (작아짐)
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return animatedStyle;
}
