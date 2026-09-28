import { darkTheme } from "@/src/design-system/themes/dark";
import { Stack } from "expo-router";

const SettingsLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: darkTheme.uiBackground },
            }}
        >
            <Stack.Screen name="legal" />
            <Stack.Screen name="health" />
        </Stack>
    );
};

export default SettingsLayout;
