import { Triangle } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Typography } from "../ui/Typography";

export default function SlideToRun({ onSuccess }: { onSuccess: () => void }) {
    const trackWidth = useSharedValue(0);
    const translateX = useSharedValue(0);
    const boxOpacity = useSharedValue(1);

    const AnimatedLinearGradient =
        Animated.createAnimatedComponent(LinearGradient);

    const onTrackLayout = (e: LayoutChangeEvent) => {
        trackWidth.value = e.nativeEvent.layout.width;
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = Math.min(
                Math.max(e.translationX, 0),
                trackWidth.value
            );
        })
        .onEnd(() => {
            if (translateX.value > trackWidth.value * 0.75) {
                translateX.value = withSpring(trackWidth.value * 2);
                boxOpacity.value = withTiming(0, { duration: 1000 });
            } else {
                translateX.value = withTiming(0);
                boxOpacity.value = withTiming(1);
            }
        });

    const gradientStyle = useAnimatedStyle(() => {
        const width = interpolate(
            translateX.value * 2,
            [0, trackWidth.value * 2],
            [0, trackWidth.value * 2]
        );

        return {
            width,
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                onLayout={onTrackLayout}
                style={{
                    position: "relative",
                    height: 56,
                    width: "100%",
                    alignItems: "flex-start",
                    overflow: "hidden",
                }}
            >
                <View
                    style={{
                        position: "relative",
                        height: 56,
                        width: "100%",
                        backgroundColor: colors.black,
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                        gap: 10,
                    }}
                >
                    <Triangle />
                    <Typography
                        variant="subhead1"
                        color="primary"
                    >
                        밀어서 러닝시작
                    </Typography>
                    <Triangle />
                </View>
                <Animated.View
                    style={{
                        position: "absolute",
                        height: 56,
                        width: "100%",
                        opacity: boxOpacity,
                    }}
                >
                    <AnimatedLinearGradient
                        start={{ x: 1, y: 0 }}
                        end={{ x: -1, y: 0 }}
                        colors={[
                            "rgba(0, 0, 0, 0)",
                            colors.primary,
                            "rgba(0, 0, 0, 0)",
                        ]}
                        style={[
                            {
                                position: "absolute",
                                height: "100%",
                            },
                            gradientStyle,
                        ]}
                    />
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}
