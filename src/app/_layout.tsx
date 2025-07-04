import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ui/toastConfig";

SplashScreen.preventAutoHideAsync();

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

export default function RootLayout() {
    const [loaded] = useFonts({
        "SpoqaHanSansNeo-Regular": require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        "SpoqaHanSansNeo-Medium": require("@/assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
        "SpoqaHanSansNeo-Bold": require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    });
    const queryClient = new QueryClient();

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <QueryClientProvider client={queryClient}>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="course" />
                        <Stack.Screen name="result/[runningId]/[courseId]/[ghostRunningId]" />
                        <Stack.Screen
                            name="run"
                            options={{ gestureEnabled: false }}
                        />
                    </Stack>
                    <Toast config={toastConfig} />
                </QueryClientProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}
