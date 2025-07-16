import { Stack } from "expo-router";

export default function RegisterLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="termDetail" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
