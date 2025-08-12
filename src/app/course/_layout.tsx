import { Stack } from "expo-router";

export default function CourseLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="[courseId]/rank"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="[courseId]/detail"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
