import { Stack } from "expo-router";

export default function CourseLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#111111" },
            }}
        >
            <Stack.Screen name="detail" />
            <Stack.Screen name="ghosty" />
            <Stack.Screen name="preview" />
        </Stack>
    );
}
