import { HomeIcon, ProfileIcon, StatsIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { usePathname, useRouter } from "expo-router";
import { memo } from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

interface TabBarProps {
    position?: "bottom" | "top" | null;
    style?: StyleProp<ViewStyle>;
}

export default memo(function TabBar({ position, style }: TabBarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { name: "stats", icon: StatsIcon, path: "/stats" },
        { name: "home", icon: HomeIcon, path: "/home" },
        { name: "profile", icon: ProfileIcon, path: "/profile" },
    ];

    return (
        <View
            style={[
                styles.container,
                position === "bottom" && styles.bottom,
                style,
            ]}
        >
            {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                    <Pressable
                        key={tab.name}
                        onPress={() => router.navigate(tab.path as any)}
                        style={styles.tab}
                    >
                        <tab.icon
                            color={isActive ? colors.primary : colors.gray[40]}
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
        height: 64,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
    },
    container: {
        paddingTop: 12,
        paddingBottom: 6,
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#111111",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: "#212121",
        borderTopWidth: 1,
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
});
