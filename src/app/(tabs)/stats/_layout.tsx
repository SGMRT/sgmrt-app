import { SplashScreen, Stack } from "expo-router";

export default function StatsLayout() {
    SplashScreen.hideAsync();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="result/[runningId]/[courseId]/[ghostRunningId]" />
        </Stack>
    );
}
