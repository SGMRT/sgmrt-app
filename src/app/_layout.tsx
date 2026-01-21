import * as amplitude from "@amplitude/analytics-react-native";
import { SessionReplayPlugin } from "@amplitude/plugin-session-replay-react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";

import { toastConfig } from "@/src/components/ui";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../store/authState";
import {
    ERROR_PRIORITY,
    shouldSendError,
} from "../utils/sentryTools";

import "@features/run/task/location.task";

import PushNotificationGate from "../features/notifications/PushNotificationGate";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import CompactNativeAdRow from "../components/ads/CompactNativeAdRow";
import { useShouldShowAd } from "../components/ads/useShouldShowAd";
import { SentryErrorBoundary } from "../components/error/SentryErrorBoundary";
import { useBootstrapApp } from "../features/bootstrap/useBootstrapApp";
import PacemakerPollingWrapper from "../features/pacemaker/PacemakerPollingWrapper";
import { useAppPermissions } from "../features/permission/useAppPermissions";
import UpdateGate from "../updates/UpdateGate";
import { devLog } from "../utils/devLog";

const env =
    process.env.NODE_ENV === "development" ? "DEVELOPMENT" : "PRODUCTION";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

// Amplitude 초기화
const amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || "";
amplitude.init(amplitudeApiKey, undefined, {
    disableCookies: true,
});

// Session Replay 플러그인 추가 (월 1,000회 제한, 2% 샘플링)
amplitude.add(
    new SessionReplayPlugin({
        sampleRate: 0.02,
    })
);

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false, // 개인정보 자동 수집 비활성화
    environment: env,
    tracesSampleRate: 0.01, // 1% 샘플링
    maxBreadcrumbs: 30, // 기본 100에서 축소
    // 기본 전송 비활성화: captureError 함수를 통해서만 명시적으로 전송
    beforeSend(event, hint) {
        // captureError 함수에서 설정한 태그로 명시적 전송 여부 확인
        // where 태그가 있으면 명시적으로 보낸 것으로 간주
        if (!event.tags?.where) {
            return null;
        }

        // 우선순위 체크: LOW는 전송 안함
        const priority = event.tags?.priority as string;
        if (priority === ERROR_PRIORITY.LOW) {
            return null;
        }

        // HIGH가 아닌 경우 중복 제한 적용
        if (priority !== ERROR_PRIORITY.HIGH) {
            const fingerprint =
                event.fingerprint?.join(":") ??
                (hint?.originalException as Error | undefined)?.message ??
                "unknown";
            if (!shouldSendError(fingerprint)) {
                return null;
            }
        }

        return event;
    },
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
    const bootReady = status === "done" || status === "error";
    const { requestOptional } = useAppPermissions();
    const shouldShowAd = useShouldShowAd();

    useEffect(() => {
        if (status !== "idle") {
            const hk = requestOptional("HEALTHKIT");
            devLog(`[bootstrap] status=${status}`, error ?? "");
        }
    }, [status, error]);

    // 폰트 미로딩 시에는 아무것도 렌더하지 않음
    if (!loaded) return null;

    return (
        <SentryErrorBoundary>
            <GestureHandlerRootView
                style={{ flex: 1, backgroundColor: "#111111" }}
            >
                <ThemeProvider
                    value={{
                        ...DarkTheme,
                        colors: {
                            ...DarkTheme.colors,
                            background: "#111111",
                        },
                    }}
                >
                    <QueryClientProvider client={queryClient}>
                        <PacemakerPollingWrapper />
                        <BottomSheetModalProvider>
                            <PushNotificationGate />
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: "#111111" },
                                    animation: "fade",
                                }}
                            >
                                <Stack.Screen name="index" />
                                <Stack.Screen name="(auth)" />
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen
                                    name="run"
                                    options={{ gestureEnabled: false }}
                                />
                                <Stack.Screen name="test" />
                            </Stack>
                            {shouldShowAd && <CompactNativeAdRow />}
                            <Toast config={toastConfig} />
                        </BottomSheetModalProvider>
                        <UpdateGate
                            bootReady={bootReady}
                            reloadNonCritical={false}
                        />
                    </QueryClientProvider>
                </ThemeProvider>
            </GestureHandlerRootView>
        </SentryErrorBoundary>
    );
}

export default Sentry.wrap(RootLayout);
