import { Stack } from "expo-router";

export default function CourseLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="rank/[courseId]"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
