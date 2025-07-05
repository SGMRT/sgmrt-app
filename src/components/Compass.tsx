import { Direction, Needle } from "@/assets/icons/icons";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export default function Compass() {
    const animatedRotation = useSharedValue(0); // 누적 회전값
    const prevHeading = useRef(0);

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            let lastUpdate = Date.now();

            const subscription = await Location.watchHeadingAsync((data) => {
                const now = Date.now();
                if (now - lastUpdate < 100) return;
                lastUpdate = now;

                const heading = data.trueHeading ?? data.magHeading ?? 0;

                const prev = prevHeading.current;
                const curr = heading;

                // delta 계산
                let delta = curr - prev;
                if (delta > 180) delta -= 360;
                else if (delta < -180) delta += 360;

                // 누적 회전값 += delta
                animatedRotation.value = withTiming(
                    animatedRotation.value + delta,
                    { duration: 150 }
                );

                prevHeading.current = curr;
            });

            return () => subscription.remove();
        })();
    }, []);

    const needleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${-animatedRotation.value}deg` }],
        };
    });
    return (
        <View style={styles.directionContainer}>
            <Animated.Image
                source={Needle}
                style={[needleStyle, { position: "absolute", width: 18 }]}
                resizeMode="contain"
            />
            <Image
                source={Direction}
                style={styles.direction}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    direction: {
        width: 352,
        height: 352,
    },

    directionContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
});
