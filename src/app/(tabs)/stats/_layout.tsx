import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#111111" },
                animation: "fade",
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="result/[runningId]/[courseId]/[ghostRunningId]" />
        </Stack>
    );
}
