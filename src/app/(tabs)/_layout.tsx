import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Renders the main tab-based layout with hidden tab bar and no headers.
 *
 * Displays three screens—"stats", "home", and "profile"—within a full-screen, dark-themed safe area view, applying safe area insets only to the bottom edge.
 */
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
                <Tabs.Screen name="profile" />
            </Tabs>
        </SafeAreaView>
    );
}
