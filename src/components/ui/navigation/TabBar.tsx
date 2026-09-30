import { MapIcon, ProfileIcon, StatsIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { usePathname, useRouter } from "expo-router";
import { memo } from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

/** 탭 한 칸의 높이. 아이콘을 누르는 면적이다. */
const TAB_HEIGHT = 64;

/**
 * 탭 바가 화면 아래에서 차지하는 높이.
 *
 * 탭 바는 absolute 로 떠 있어 아래 내용을 가린다.
 * 가려지면 안 되는 내용을 둔 화면은 이 값만큼 아래를 비워 둔다.
 */
export const TAB_BAR_HEIGHT = spacing[16] + TAB_HEIGHT + spacing[6];

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
                    <Pressable
                        key={tab.name}
                        onPress={() => router.navigate(tab.path as any)}
                        style={styles.tab}
                    >
                        <tab.icon
                            color={isActive ? darkTheme.primary : darkTheme.ui07}
                            width={24}
                            height={24}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    tab: {
        flex: 1,
        height: TAB_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        paddingBottom: spacing[6],
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
        paddingTop: spacing[16],
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
