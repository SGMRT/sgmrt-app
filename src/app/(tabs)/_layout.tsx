import { HomeIcon, ProfileIcon, StatsIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarLabel: () => null,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    paddingTop: 15,
                    borderTopWidth: 0,
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
    );
}
