import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

interface HomeTopBarProps {
    type: "all" | "my";
    setType: (type: "all" | "my") => void;
}

const TAB_WIDTH = 96;
const TAB_HEIGHT = 40;
const GAP = 4;
const PADDING = 5;

export default function HomeTopBar({ type, setType }: HomeTopBarProps) {
    const x = useRef(new Animated.Value(0)).current;

    // target position
    const targetX = useMemo(
        () => (type === "all" ? 0 : TAB_WIDTH + GAP),
        [type]
    );

    useEffect(() => {
        Animated.spring(x, {
            toValue: targetX,
            useNativeDriver: true,
            stiffness: 400,
            damping: 28,
            mass: 0.9,
        }).start();
    }, [targetX, x]);

    return (
        <View style={styles.container}>
            {/* moving pill background */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.activePill,
                    {
                        transform: [{ translateX: x }],
                    },
                ]}
            />
            {/* tabs */}
            <Pressable
                onPress={() => setType("all")}
                style={({ pressed }) => [
                    styles.button,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                hitSlop={8}
            >
                <Typography
                    variant="subhead3"
                    color={type === "all" ? "primary" : "gray40"}
                >
                    고스트 코스
                </Typography>
            </Pressable>

            <Pressable
                onPress={() => setType("my")}
                style={({ pressed }) => [
                    styles.button,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                hitSlop={8}
            >
                <Typography
                    variant="subhead3"
                    color={type === "my" ? "primary" : "gray40"}
                >
                    내 코스
                </Typography>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        flexDirection: "row",
        alignSelf: "center",
        gap: GAP,
        padding: PADDING,
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        borderRadius: 999,
    },
    button: {
        width: TAB_WIDTH,
        height: TAB_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    activePill: {
        position: "absolute",
        left: PADDING,
        top: PADDING,
        width: TAB_WIDTH,
        height: TAB_HEIGHT,
        borderRadius: 999,
        backgroundColor: "#262626",
    },
});
