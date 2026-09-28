import { darkTheme } from "@/src/design-system/themes/dark";
import { SplashScreen, Stack } from "expo-router";

export default function ProfileLayout() {
    SplashScreen.hideAsync();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: darkTheme.uiBackground },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="editInfo" />
            <Stack.Screen name="termDetail" />
            <Stack.Screen name="notice" />
            <Stack.Screen name="[courseId]" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
