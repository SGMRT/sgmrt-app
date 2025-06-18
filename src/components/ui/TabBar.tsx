import { HomeIcon, ProfileIcon, StatsIcon } from "@/assets/icons/icons";
import colors from "@/src/theme/colors";
import { usePathname, useRouter } from "expo-router";
import { memo } from "react";
import {
    Image,
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
                    >
                        <Image
                            source={tab.icon}
                            style={{
                                width: 24,
                                height: 24,
                                tintColor: isActive
                                    ? colors.gray[40]
                                    : colors.gray[60],
                                opacity: isActive ? 1 : 0.3,
                            }}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: "100%",
        height: 64,
        backgroundColor: colors.black,
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    bottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
});
