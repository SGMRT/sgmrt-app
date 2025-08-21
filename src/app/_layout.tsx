import * as amplitude from "@amplitude/analytics-react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAudioModeAsync } from "expo-audio";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { SplashScreen, Stack, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/ui/toastConfig";
import { useAuthStore } from "../store/authState";
import { LOCATION_TASK } from "../types/run";
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

const FIRST_LAUNCH_KEY = "first_launch_v1";
const VERSION_KEY = "version_v1";

function RootLayout() {
    const router = useRouter();
    const { isLoggedIn, logout, uuid, userInfo } = useAuthStore();
    const [loaded] = useFonts({
        "SpoqaHanSansNeo-Regular": require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        "SpoqaHanSansNeo-Medium": require("@/assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
        "SpoqaHanSansNeo-Bold": require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    });
    const queryClient = new QueryClient();
    const version = Constants.expoConfig?.version;
    const build = Constants.expoConfig?.extra?.eas?.buildNumber;

    useEffect(() => {
        (async () => {
            // fonts 미로딩 시 조기 종료
            if (!loaded) return;

            try {
                // 1) App Launched (매 실행)
                amplitude.track("App Launched", {
                    platform: Platform.OS,
                    version,
                    build,
                });

                // 2) First Install 체크 (단 1회)
                const first = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
                if (!first) {
                    amplitude.track("App Installed", {
                        platform: Platform.OS,
                        version,
                        build,
                    });

                    // setOnce로 유저 프로퍼티 박제(덮어쓰기 방지)
                    const idObj = new amplitude.Identify()
                        .setOnce("first_open_at", new Date().toISOString())
                        .setOnce("install_version", version ?? "")
                        .setOnce("install_build", build ?? "")
                        .setOnce("install_platform", Platform.OS);
                    amplitude.identify(idObj);

                    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
                }

                // 3) App Updated (버전 변경 감지)
                const lastVersion = await AsyncStorage.getItem(VERSION_KEY);
                if (lastVersion && lastVersion !== version) {
                    amplitude.track("App Updated", {
                        from: lastVersion,
                        to: version,
                        build,
                    });
                }
                await AsyncStorage.setItem(VERSION_KEY, version ?? "");
            } catch (e) {
                console.warn("Analytics bootstrap error:", e);
            }
        })();
    }, [loaded, version, build]);

    useEffect(() => {
        if (!loaded) return;

        // if (!userInfo?.username) {
        //     logout();
        // }
        const stopTrackingAndLiveActivity = async () => {
            try {
                if (
                    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
                ) {
                    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
                }
            } catch (e) {
                console.error("Cleanup error:", e);
            }
        };

        const initAudioModule = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    interruptionMode: "duckOthers",
                    shouldPlayInBackground: true,
                });
            } catch (e) {
                console.error("Audio module init error:", e);
            }
        };

        initAudioModule();
        stopTrackingAndLiveActivity();

        if (isLoggedIn) {
            router.replace("/intro");
        } else {
            router.replace("/(auth)/login");
        }

        SplashScreen.hideAsync();
    }, [isLoggedIn, loaded, userInfo, router]);

    if (!loaded) {
        return null;
    }

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
                </BottomSheetModalProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

export default Sentry.wrap(RootLayout);
