import * as amplitude from "@amplitude/analytics-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync } from "expo-audio";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { SplashScreen, useRouter } from "expo-router";
import { Barometer, Pedometer } from "expo-sensors";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

import { LOCATION_TASK } from "@/src/types/run";

const FIRST_LAUNCH_KEY = "first_launch_v1";
const VERSION_KEY = "version_v1";

type Status = "idle" | "running" | "blocked" | "done" | "error";

/**
 * Requests foreground permissions for location, pedometer, and barometer.
 *
 * Returns true if all three permissions are granted. If any permission is missing,
 * displays an alert (Korean) prompting the user to open system settings and returns false.
 *
 * @returns Whether all required permissions were granted.
 */
async function requestPermissions(): Promise<boolean> {
    const locationPermission =
        await Location.requestForegroundPermissionsAsync();
    const pedometerPermission = await Pedometer.requestPermissionsAsync();
    const barometerPermission = await Barometer.requestPermissionsAsync();

    const locationGranted = locationPermission.status === "granted";
    const pedometerGranted = pedometerPermission.status === "granted";
    const barometerGranted = barometerPermission.status === "granted";

    if (locationGranted && pedometerGranted && barometerGranted) {
        return true;
    }

    const missing: string[] = [];
    if (!locationGranted) missing.push("위치");
    if (!pedometerGranted) missing.push("활동");
    if (!barometerGranted) missing.push("기압");

    const message = `${missing.join(
        ", "
    )} 권한이 허용되지 않았습니다.\n\n서비스 이용을 위해 설정에서 권한을 허용해주세요.`;

    Alert.alert("권한이 부족해요", message, [
        { text: "취소", style: "cancel" },
        { text: "설정으로 이동", onPress: () => Linking.openSettings() },
    ]);

    return false;
}

/**
 * Stops any active background location updates for the configured LOCATION_TASK.
 *
 * If location updates for LOCATION_TASK are currently running, this function stops them; it swallows and logs any errors encountered during cleanup.
 *
 * @returns A promise that resolves once the stop operation completes.
 */
async function stopTrackingAndLiveActivity() {
    try {
        if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK);
        }
    } catch (e) {
        console.error("Cleanup error:", e);
    }
}

/**
 * Configure the app's global audio mode for playback and background behavior.
 *
 * Sets the audio mode to play in silent mode, duck other audio on interruptions,
 * and allow playback while the app runs in the background. Initialization errors
 * are caught and logged; the function does not throw.
 *
 * @returns A promise that resolves once the audio mode has been configured.
 */
export async function initAudioModule() {
    try {
        await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: "duckOthers",
            shouldPlayInBackground: true,
        } as any);
    } catch (e) {
        console.error("Audio module init error:", e);
    }
}

/**
 * Initialize analytics on app startup: track launch, detect first install and updates, and persist install/version metadata.
 *
 * Records:
 * - "App Launched" on every run (includes platform, version, build).
 * - "App Installed" once on first launch and sets Identify properties (`first_open_at`, `install_version`, `install_build`, `install_platform`).
 * - "App Updated" when a previously stored version differs from the current `version`.
 *
 * Persists first-launch and current version to AsyncStorage keys so subsequent runs can detect installs/updates.
 *
 * @param version - Optional app version string to include in events and persistence.
 * @param build - Optional build identifier to include in events.
 * @returns A promise that resolves when analytics bootstrap completes.
 */
async function bootstrapAnalytics({
    version,
    build,
}: {
    version?: string;
    build?: string;
}) {
    try {
        // 매 실행
        amplitude.track("App Launched", {
            platform: Platform.OS,
            version,
            build,
        });

        // 첫 설치 1회
        const first = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (!first) {
            amplitude.track("App Installed", {
                platform: Platform.OS,
                version,
                build,
            });

            const idObj = new amplitude.Identify()
                .setOnce("first_open_at", new Date().toISOString())
                .setOnce("install_version", version ?? "")
                .setOnce("install_build", build ?? "")
                .setOnce("install_platform", Platform.OS);
            amplitude.identify(idObj);

            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
        }

        // 업데이트 감지
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
}

/**
 * Runs the app bootstrap sequence and exposes progress/error state.
 *
 * After fonts are loaded, this hook requests required device permissions, initializes
 * platform services (audio, location cleanup), boots analytics, navigates to the
 * appropriate initial screen based on authentication state, and hides the splash screen.
 * Progress is reported via the returned `status` and any runtime error is captured in `error`.
 *
 * @param isLoggedIn - True when the user is authenticated; determines post-bootstrap route.
 * @param loadedFonts - Must be true before the bootstrap sequence starts; the hook waits for fonts.
 * @returns An object with `status` ("idle" | "running" | "blocked" | "done" | "error") and `error` (captured exception or null).
 */
export function useBootstrapApp(isLoggedIn: boolean, loadedFonts: boolean) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<unknown>(null);

    const version = useMemo(() => Constants.expoConfig?.version, []);
    const build = useMemo(
        () =>
            Constants.expoConfig?.extra?.eas?.buildNumber as string | undefined,
        []
    );

    useEffect(() => {
        if (!loadedFonts) return;

        let cancelled = false;
        const run = async () => {
            setStatus("running");

            try {
                // 1) 권한
                const granted = await requestPermissions();
                if (!granted) {
                    if (!cancelled) setStatus("blocked");
                    // 권한 거부 시 스플래시는 닫아 UX를 막지 않음 (권한 설정 유도)
                    await SplashScreen.hideAsync();
                    return;
                }

                // 2) 초기화
                await Promise.all([
                    initAudioModule(),
                    stopTrackingAndLiveActivity(),
                ]);

                // 3) 분석 로깅
                await bootstrapAnalytics({ version, build });

                // 4) 라우팅
                if (cancelled) return;
                if (isLoggedIn) {
                    console.log("replace to /(tabs)/home");
                    router.replace("/(tabs)/home");
                } else {
                    console.log("replace to /(auth)/login");
                    router.replace("/(auth)/login");
                }

                // 5) 스플래시 종료
                await SplashScreen.hideAsync();
                if (!cancelled) setStatus("done");
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError(e);
                    setStatus("error");
                    // 에러 시에도 스플래시는 닫아줌
                    await SplashScreen.hideAsync();
                }
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, loadedFonts, router, version, build]);

    return { status, error };
}
