import { Triangle } from "@/assets/icons/icons";
import colors from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ColorValue, Image, LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Typography } from "./Typography";

interface SlideToDualActionProps {
    onSlideLeft: () => void;
    onSlideRight: () => void;
    leftLabel: string;
    rightLabel: string;
}

export default function SlideToDualAction({
    onSlideLeft,
    onSlideRight,
    leftLabel,
    rightLabel,
}: SlideToDualActionProps) {
    const trackWidth = useSharedValue(0);
    const translateX = useSharedValue(0);
    const boxOpacity = useSharedValue(1);
    const isDragging = useSharedValue(false);
    const direction = useSharedValue<"left" | "right" | null>(null);
    const [gradientColors, setGradientColors] = useState<
        readonly [ColorValue, ColorValue, ...ColorValue[]]
    >(["rgba(0, 0, 0, 0)", "#CFE900", "rgba(0, 0, 0, 0)"]);

    const AnimatedLinearGradient =
        Animated.createAnimatedComponent(LinearGradient);

    const onTrackLayout = (e: LayoutChangeEvent) => {
        trackWidth.value = e.nativeEvent.layout.width;
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (!isDragging.value) {
                if (Math.abs(e.translationX) > 8) {
                    isDragging.value = true;
                    direction.value = e.translationX > 0 ? "left" : "right";
                    runOnJS(setGradientColors)(
                        direction.value === "left"
                            ? [
                                  "rgba(0, 0, 0, 0)",
                                  "#CFE900",
                                  "rgba(0, 0, 0, 0)",
                              ]
                            : ["#CFE900", "rgba(0, 0, 0, 0)", "#CFE900"]
                    );
                }
            }

            translateX.value = Math.min(
                Math.max(
                    direction.value === "left"
                        ? e.translationX
                        : -e.translationX,
                    0
                ),
                trackWidth.value
            );
        })
        .onEnd(() => {
            if (translateX.value > trackWidth.value * 0.75) {
                translateX.value = withSpring(trackWidth.value * 2);
                boxOpacity.value = withTiming(0, { duration: 1000 });
                runOnJS(
                    direction.value === "left" ? onSlideLeft : onSlideRight
                )();
                isDragging.value = false;
                runOnJS(setTimeout)(() => {
                    translateX.value = withTiming(0);
                    boxOpacity.value = withTiming(1);
                }, 1200);
            } else {
                translateX.value = withTiming(0);
                boxOpacity.value = withTiming(1);
                isDragging.value = false;
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

    const slideDirectionStyle = useAnimatedStyle(() => {
        return {
            alignItems: direction.value === "left" ? "flex-start" : "flex-end",
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
                        backgroundColor: "#111111",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginHorizontal: 16,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Image
                            source={Triangle}
                            style={{
                                tintColor: colors.primary,
                                transform: [
                                    {
                                        rotate: "180deg",
                                    },
                                ],
                            }}
                        />
                        <Typography variant="subhead1" color="primary">
                            {leftLabel}
                        </Typography>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography variant="subhead1" color="primary">
                            {rightLabel}
                        </Typography>
                        <Image
                            source={Triangle}
                            style={{
                                tintColor: colors.primary,
                            }}
                        />
                    </View>
                </View>
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            height: 56,
                            width: "100%",
                            opacity: boxOpacity,
                        },
                        slideDirectionStyle,
                    ]}
                >
                    <AnimatedLinearGradient
                        start={{ x: 1, y: 0 }}
                        end={{ x: -1, y: 0 }}
                        colors={gradientColors}
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
