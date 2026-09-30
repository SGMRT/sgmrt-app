import { MapIcon, ProfileIcon, StatsIcon } from "@/assets/svgs/svgs";
import { SvgProps } from "react-native-svg";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { usePathname, useRouter } from "expo-router";
import { ComponentType, memo } from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {
    duration,
    pressScale,
    spring,
} from "@/src/design-system/tokens/motion";

/** 탭 한 칸의 높이. 아이콘을 누르는 면적이다. */
const TAB_HEIGHT = 64;
/** 아래쪽 여백. 두 변형이 같이 쓴다. */
const TAB_BAR_PADDING_BOTTOM = spacing[6];
/** 둥근 윗면을 가진 변형만 위에 더 갖는 여백. */
const TAB_BAR_PADDING_TOP = spacing[16];

/**
 * 탭 바가 화면 아래에서 차지하는 높이.
 *
 * 탭 바는 absolute 로 떠 있어 아래 내용을 가린다.
 * 가려지면 안 되는 내용을 둔 화면은 이 값만큼 아래를 비워 둔다.
 *
 * `topRound` 를 켠 기본 모습의 값이다. 끄면 위 여백이 없어
 * TAB_BAR_HEIGHT_FLAT 만큼만 차지한다. 지금 끄고 쓰는 곳은 지도 탭 하나뿐인데,
 * 지도는 아래를 비워 둘 내용이 없어 이 값을 쓰지 않는다.
 */
export const TAB_BAR_HEIGHT =
    TAB_BAR_PADDING_TOP + TAB_HEIGHT + TAB_BAR_PADDING_BOTTOM;
export const TAB_BAR_HEIGHT_FLAT = TAB_HEIGHT + TAB_BAR_PADDING_BOTTOM;

interface TabBarProps {
    position?: "bottom" | "top" | null;
    style?: StyleProp<ViewStyle>;
    topRound?: boolean;
}

export default memo(function TabBar({
    position,
    style,
    topRound = true,
}: TabBarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { name: "stats", icon: StatsIcon, path: "/stats" },
        { name: "home", icon: MapIcon, path: "/home" },
        { name: "profile", icon: ProfileIcon, path: "/profile" },
    ];

    return (
        <View
            style={[
                styles.container,
                position === "bottom" && styles.bottom,
                topRound && styles.topRound,
                style,
            ]}
        >
            {tabs.map((tab) => {
                const isActive = pathname.includes(tab.path);
                return (
                    <Tab
                        key={tab.name}
                        icon={tab.icon}
                        isActive={isActive}
                        onPress={() => router.navigate(tab.path as any)}
                    />
                );
            })}
        </View>
    );
});

/**
 * 탭 한 칸.
 *
 * 누르면 아이콘이 줄었다 스프링으로 돌아온다.
 * 이미 보고 있는 탭을 눌렀을 때는 화면이 바뀌지 않으므로,
 * 누름 표시가 없으면 눌린 것인지 앱이 멈춘 것인지 알 수 없다.
 *
 * 색은 누름에 따라 바꾸지 않는다. 여기서 색은 지금 어느 화면에 있는지를
 * 뜻하고, 그 뜻을 손가락 아래에서 잠깐 흔들면 읽는 사람이 헷갈린다.
 */
function Tab({
    icon: Icon,
    isActive,
    onPress,
}: {
    icon: ComponentType<SvgProps>;
    isActive: boolean;
    onPress: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const press = (down: boolean) => {
        if (reduceMotion) return;
        scale.value = down
            ? withTiming(pressScale.compact, { duration: duration.press })
            : withSpring(1, spring.press);
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => press(true)}
            onPressOut={() => press(false)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
        >
            <Animated.View style={animatedStyle}>
                <Icon
                    color={isActive ? darkTheme.primary : darkTheme.ui07}
                    width={24}
                    height={24}
                />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    tab: {
        flex: 1,
        height: TAB_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        paddingBottom: TAB_BAR_PADDING_BOTTOM,
        flexDirection: "row",
        width: "100%",
        backgroundColor: darkTheme.uiBackground,
        justifyContent: "space-between",
        alignItems: "center",

        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    topRound: {
        paddingTop: TAB_BAR_PADDING_TOP,
        borderColor: darkTheme.ui01,
        borderTopWidth: 1,
        borderTopStartRadius: radius["2xl"],
        borderTopEndRadius: radius["2xl"],
    },
    bottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
});
