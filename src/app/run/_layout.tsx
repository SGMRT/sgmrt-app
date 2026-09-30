import { Stack } from "expo-router";
import { darkTheme } from "@/src/design-system/themes/dark";

export default function RunLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: darkTheme.uiBackground },
                animation: "fade",
            }}
        >
            <Stack.Screen name="solo" />
            <Stack.Screen name="[courseId]/[ghostRunningId]" />
        </Stack>
    );
}
