import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            backBehavior="history"
            tabBar={() => null}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="stats" />
            <Tabs.Screen name="home" />
            <Tabs.Screen name="(profile)" />
        </Tabs>
    );
}
