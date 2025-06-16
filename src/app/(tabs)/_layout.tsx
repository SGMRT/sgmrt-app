import { HomeIcon, ProfileIcon, StatsIcon, Triangle } from "@/assets/svgs/svgs";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { Tabs, usePathname } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
    const pathname = usePathname();
    const isHome = pathname.includes("home");
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }}>
            <Tabs
                backBehavior="history"
                screenOptions={{
                    headerShown: false,
                    tabBarLabel: () => null,
                    tabBarStyle: {
                        backgroundColor: colors.black,
                        borderTopWidth: 0,
                        alignItems: "center",
                        flexDirection: "row",
                        height: 64,
                    },
                }}
            >
                <Tabs.Screen
                    name="stats"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <StatsIcon
                                opacity={focused ? 1 : 0.3}
                                width={24}
                                height={24}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="home"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <HomeIcon
                                opacity={focused ? 1 : 0.3}
                                width={24}
                                height={24}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <ProfileIcon
                                opacity={focused ? 1 : 0.3}
                                width={24}
                                height={24}
                            />
                        ),
                    }}
                />
            </Tabs>
            {isHome && (
                <View
                    style={{
                        height: 56,
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
                        style={{ color: colors.primary }}
                    >
                        밀어서 러닝시작
                    </Typography>
                    <Triangle />
                </View>
            )}
        </SafeAreaView>
    );
}
