import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="stats" />
            <Stack.Screen name="result/[runningId]/[courseId]/[ghostRunningId]" />
        </Stack>
    );
}
