import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#111111" },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="editInfo" />
            <Stack.Screen name="termDetail" />
            <Stack.Screen name="notice" />
            <Stack.Screen name="[courseId]/detail" />
            <Stack.Screen name="[courseId]/rank" />
        </Stack>
    );
}
