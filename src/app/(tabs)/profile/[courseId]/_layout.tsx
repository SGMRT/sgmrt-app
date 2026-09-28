import { darkTheme } from "@/src/design-system/themes/dark";
import { Stack } from "expo-router";

export default function CourseLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: darkTheme.uiBackground },
            }}
        >
            <Stack.Screen name="detail" />
            <Stack.Screen name="ghosty" />
            <Stack.Screen name="preview" />
        </Stack>
    );
}
