import { MenuIcon } from "@/assets/svgs/svgs";
import { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import { Typography } from "../ui/Typography";

interface HomeTopBarProps {
    type: "all" | "my";
    setType: (type: "all" | "my") => void;
    onClickMenu: () => void;
}

const TAB_HEIGHT = 40;
const GAP = 4;
const PADDING = 5;
const SIDE_MARGIN = 16.5;
const MENU_SIZE = 48;
const MENU_GAP = 6; // 메뉴 버튼과 탭 컨테이너 사이 간격
const TAB_COUNT = 3;

/**
 * Top bar with a left-side menu button and a 3-tab segmented control with an animated sliding active pill.
 *
 * Renders a circular menu button that calls `onClickMenu`, and a tab group sized responsively to window width.
 * The active tab pill animates horizontally when `type` changes (maps "all" → first tab, "my" → second tab).
 * The third tab shows an informational toast and is not selectable. Tabs call `setType` to switch between "all" and "my".
 *
 * @param type - Currently selected tab key: `"all"` or `"my"`.
 * @param setType - Callback invoked with the new tab key when user selects the first or second tab.
 * @param onClickMenu - Callback invoked when the menu button is pressed.
 * @returns A React element containing the menu button and tab control.
 */
export default function HomeTopBar({
    type,
    setType,
    onClickMenu,
}: HomeTopBarProps) {
    const x = useRef(new Animated.Value(0)).current;
    const { width: windowWidth } = useWindowDimensions();

    // 컨테이너 및 탭 너비 계산
    const containerWidth = useMemo(() => {
        const w = windowWidth - SIDE_MARGIN * 2 - MENU_SIZE - MENU_GAP;
        return Math.max(w, 0);
    }, [windowWidth]);

    const tabWidth = useMemo(() => {
        const inner = containerWidth - PADDING * 2 - GAP * (TAB_COUNT - 1);
        const w = inner / TAB_COUNT;
        return Math.max(0, w);
    }, [containerWidth]);

    // type → index 매핑
    const activeIndex = type === "all" ? 0 : 1;
    const targetX = useMemo(
        () => activeIndex * (tabWidth + GAP),
        [activeIndex, tabWidth]
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
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                marginHorizontal: SIDE_MARGIN,
                gap: MENU_GAP,
            }}
        >
            <Pressable
                style={{
                    width: MENU_SIZE,
                    height: MENU_SIZE,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(17, 17, 17, 0.8)",
                    borderRadius: 999,
                }}
                onPress={onClickMenu}
            >
                <MenuIcon />
            </Pressable>

            <View style={[styles.container, { width: containerWidth }]}>
                {/* moving pill background */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.activePill,
                        {
                            width: tabWidth,
                            transform: [{ translateX: x }],
                        },
                    ]}
                />

                {/* tabs */}
                <Pressable
                    onPress={() => setType("all")}
                    style={({ pressed }) => [
                        styles.button,
                        {
                            width: tabWidth,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
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
                        {
                            width: tabWidth,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
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

                <Pressable
                    onPress={() =>
                        Toast.show({
                            type: "info",
                            text1: "챌린지 코스는 준비중입니다.",
                            topOffset: 60,
                        })
                    }
                    style={({ pressed }) => [
                        styles.button,
                        {
                            width: tabWidth,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                    ]}
                    hitSlop={8}
                >
                    <Typography variant="subhead3" color={"gray40"}>
                        챌린지 코스
                    </Typography>
                </Pressable>
            </View>
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
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    button: {
        height: TAB_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    activePill: {
        position: "absolute",
        left: PADDING,
        top: PADDING,
        height: TAB_HEIGHT,
        borderRadius: 999,
        backgroundColor: "#262626",
    },
});
