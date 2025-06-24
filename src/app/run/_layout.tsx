import { Stack } from "expo-router";

export default function RunLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="result/[resultId]" />
        </Stack>
    );
}
