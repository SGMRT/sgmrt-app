import { Triangle } from "@/assets/icons/icons";
import colors from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Image, LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Typography } from "../ui/Typography";

interface SlideToActionProps {
    label: string;
    onSlideSuccess: () => void;
    color: "red" | "green";
    direction: "left" | "right";
}

/**
 * A React Native component that displays a slide-to-confirm action with animated feedback.
 *
 * Renders a horizontal slider with a customizable label, color theme, and sliding direction. When the user slides past 75% of the track, the slider animates to completion, fades out, and triggers the provided callback.
 *
 * @param label - The text displayed on the slider.
 * @param onSlideSuccess - Callback invoked when the slide action completes successfully.
 * @param color - The color theme of the slider ("red" or "green").
 * @param direction - The direction in which the slider can be moved ("left" or "right").
 *
 * @returns A slide-to-action UI component.
 */
export default function SlideToAction({
    label,
    onSlideSuccess,
    color,
    direction,
}: SlideToActionProps) {
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
                Math.max(
                    direction === "left" ? e.translationX : -e.translationX,
                    0
                ),
                trackWidth.value
            );
        })
        .onEnd(() => {
            if (translateX.value > trackWidth.value * 0.75) {
                translateX.value = withSpring(trackWidth.value * 2);
                boxOpacity.value = withTiming(0, { duration: 1000 });
                runOnJS(onSlideSuccess)();
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
                }}
            >
                <View
                    style={{
                        position: "relative",
                        height: 56,
                        width: "100%",
                        backgroundColor: "#111111",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                        gap: 10,
                    }}
                >
                    <Image
                        source={Triangle}
                        style={{
                            tintColor:
                                color === "red" ? "#FF3358" : colors.primary,
                            transform: [
                                {
                                    rotate:
                                        direction === "left"
                                            ? "0deg"
                                            : "180deg",
                                },
                            ],
                        }}
                    />
                    <Typography
                        variant="subhead1"
                        color={color === "red" ? "red" : "primary"}
                    >
                        {label}
                    </Typography>
                    <Image
                        source={Triangle}
                        style={{
                            tintColor:
                                color === "red" ? "#FF3358" : colors.primary,
                            transform: [
                                {
                                    rotate:
                                        direction === "left"
                                            ? "0deg"
                                            : "180deg",
                                },
                            ],
                        }}
                    />
                </View>
                <Animated.View
                    style={{
                        position: "absolute",
                        height: 56,
                        width: "100%",
                        opacity: boxOpacity,
                        alignItems:
                            direction === "left" ? "flex-start" : "flex-end",
                    }}
                >
                    <AnimatedLinearGradient
                        start={{ x: 1, y: 0 }}
                        end={{ x: -1, y: 0 }}
                        colors={
                            direction === "left"
                                ? [
                                      "rgba(0, 0, 0, 0)",
                                      color === "red" ? "#FF3358" : "#CFE900",
                                      "rgba(0, 0, 0, 0)",
                                  ]
                                : [
                                      color === "red" ? "#FF3358" : "#CFE900",
                                      "rgba(0, 0, 0, 0)",
                                      color === "red" ? "#FF3358" : "#CFE900",
                                  ]
                        }
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
