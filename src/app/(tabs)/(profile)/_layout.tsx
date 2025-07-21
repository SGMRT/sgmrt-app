import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="profile" />
            <Stack.Screen name="editInfo" />
            <Stack.Screen name="termDetail" />
        </Stack>
    );
}
