import { Stack } from "expo-router";

const SettingsLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#111111" },
            }}
        >
            <Stack.Screen name="legal" />
            <Stack.Screen name="health" />
        </Stack>
    );
};

export default SettingsLayout;
