import * as amplitude from "@amplitude/analytics-react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";

import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ui/toastConfig";
import { useAuthStore } from "../store/authState";

import "@features/run/task/location.task";
import { useBootstrapApp } from "../features/bootstrap/useBootstrapApp";

SplashScreen.preventAutoHideAsync();

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");
amplitude.init(process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || "", undefined, {
    disableCookies: true,
});

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
});

function RootLayout() {
    const queryClient = useMemo(() => new QueryClient(), []);
    const { isLoggedIn } = useAuthStore();
    const [loaded] = useFonts({
        "SpoqaHanSansNeo-Regular": require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        "SpoqaHanSansNeo-Medium": require("@/assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
        "SpoqaHanSansNeo-Bold": require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    });

    const { status, error } = useBootstrapApp(isLoggedIn, loaded);

    useEffect(() => {
        if (status !== "idle") {
            console.log(`[bootstrap] status=${status}`, error ?? "");
        }
    }, [status, error]);

    // 폰트 미로딩 시에는 아무것도 렌더하지 않음
    if (!loaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <BottomSheetModalProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: "#090A0A" },
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="course" />
                        <Stack.Screen name="result/[runningId]/[courseId]/[ghostRunningId]" />
                        <Stack.Screen
                            name="run"
                            options={{ gestureEnabled: false }}
                        />
                    </Stack>
                    <Toast config={toastConfig} />
                </BottomSheetModalProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

export default Sentry.wrap(RootLayout);
