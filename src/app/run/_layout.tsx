import { Stack } from "expo-router";

export default function RunLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="solo" />
            <Stack.Screen name="[courseId]/course" />
            <Stack.Screen name="[courseId]/ghost" />
        </Stack>
    );
}
