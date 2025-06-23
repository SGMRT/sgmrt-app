import colors from "@/src/theme/colors";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface CountdownProps {
    count: number;
    color: string;
    size: number;
    onComplete: () => void;
}

export default function Countdown({
    count,
    color,
    size,
    onComplete,
}: CountdownProps) {
    const [countdown, setCountdown] = useState(count);

    const startCountdown = useCallback(() => {
        let currentCount = count;
        const interval = setInterval(() => {
            currentCount -= 1;
            if (currentCount === 0) {
                clearInterval(interval);
                onComplete();
            } else {
                setCountdown(currentCount);
            }
        }, 1000);
    }, [count, onComplete]);

    useEffect(() => {
        startCountdown();
    }, [startCountdown]);

    return (
        <Animated.Text
            key={countdown}
            style={[styles.timeText, { color: colors.primary }]}
            entering={FadeIn.duration(1000)}
        >
            {countdown}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
});
