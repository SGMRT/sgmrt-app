import { Stack } from "expo-router";

export default function RunLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#111111" },
                animation: "fade",
            }}
        >
            <Stack.Screen name="solo" />
            <Stack.Screen name="[courseId]/[ghostRunningId]" />
        </Stack>
    );
}
