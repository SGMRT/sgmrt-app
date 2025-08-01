import LiveActivities from "@/modules/expo-live-activity";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { SplashScreen, Stack, useRouter } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ui/toastConfig";
import { useAuthStore } from "../store/authState";
import { LOCATION_TASK } from "../types/run";

SplashScreen.preventAutoHideAsync();

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
});

function RootLayout() {
    const router = useRouter();
    const { isLoggedIn, logout, userInfo } = useAuthStore();
    const [loaded] = useFonts({
        "SpoqaHanSansNeo-Regular": require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        "SpoqaHanSansNeo-Medium": require("@/assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
        "SpoqaHanSansNeo-Bold": require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    });
    const queryClient = new QueryClient();

    useEffect(() => {
        if (!loaded) return;

        SplashScreen.hideAsync();

        // if (!userInfo?.username) {
        //     logout();
        // }
        const stopTrackingAndLiveActivity = async () => {
            try {
                if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK)) {
                    await TaskManager.unregisterTaskAsync(LOCATION_TASK);
                }
                if (
                    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
                ) {
                    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
                }

                setTimeout(() => {
                    try {
                        const isActivityInProgress =
                            LiveActivities.isActivityInProgress();
                        if (isActivityInProgress) {
                            LiveActivities.endActivity();
                        }
                    } catch (e) {
                        console.warn("LiveActivities crash avoided:", e);
                    }
                }, 100);
            } catch (e) {
                console.error("Cleanup error:", e);
            }
        };

        stopTrackingAndLiveActivity();

        if (isLoggedIn) {
            router.replace("/intro");
        } else {
            router.replace("/(auth)/login");
        }
    }, [isLoggedIn, loaded, userInfo]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <QueryClientProvider client={queryClient}>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="intro" />
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
                </QueryClientProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}

export default Sentry.wrap(RootLayout);
