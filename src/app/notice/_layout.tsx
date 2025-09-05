import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoticeLayout() {
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: "#111111" }}
            edges={["bottom"]}
        >
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="[noticeId]" />
            </Stack>
        </SafeAreaView>
    );
}
