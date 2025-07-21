import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: "#111111" }}
            edges={["bottom"]}
        >
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
        </SafeAreaView>
    );
}
