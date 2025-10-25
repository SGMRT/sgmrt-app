import expoLiveActivity from "@/modules/expo-live-activity";
import { devLog, errorLog } from "@/src/utils/devLog";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import * as amplitude from "@amplitude/analytics-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync } from "expo-audio";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { PermissionStatus } from "expo-tracking-transparency";
import { useEffect, useMemo, useState } from "react";
import { InteractionManager, Platform } from "react-native";
import { Settings } from "react-native-fbsdk-next";
import mobileAds, {
    AdsConsent,
    AdsConsentDebugGeography,
    AdsConsentStatus,
    MaxAdContentRating,
} from "react-native-google-mobile-ads";
import { useAppPermissions } from "../permission/useAppPermissions";
import { LOCATION_TASK } from "../run/constants";

const FIRST_LAUNCH_KEY = "first_launch_v1";
const VERSION_KEY = "version_v1";

type Status = "idle" | "running" | "blocked" | "done" | "error";

let ADS_INIT_DONE = false;

async function initAds() {
    if (ADS_INIT_DONE) return;
    const testDeviceId = process.env.EXPO_PUBLIC_AD_TEST_DEVICE_ID ?? "";
    try {
        // UMP 동의 정보 요청
        const consentInfo = await AdsConsent.requestInfoUpdate({
            debugGeography: __DEV__
                ? AdsConsentDebugGeography.EEA
                : AdsConsentDebugGeography.DISABLED,
            testDeviceIdentifiers: __DEV__
                ? ["EMULATOR", testDeviceId]
                : [testDeviceId],
        });

        // 동의 폼이 필요할 경우 표시
        if (
            consentInfo.isConsentFormAvailable &&
            consentInfo.status === AdsConsentStatus.REQUIRED
        ) {
            const { canRequestAds } =
                await AdsConsent.loadAndShowConsentFormIfRequired();
            if (!canRequestAds) {
                return;
            }
        }

        await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.T,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
            testDeviceIdentifiers: __DEV__
                ? ["EMULATOR", testDeviceId]
                : [testDeviceId],
        });

        await mobileAds().initialize();
        ADS_INIT_DONE = true;
    } catch (e) {
        errorLog("AdMob init error:", e);
    }
}

async function stopTrackingAndLiveActivity() {
    try {
        if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK);
        }
        if (await expoLiveActivity.hasActiveActivities()) {
            await expoLiveActivity.endActivity();
        }
    } catch (e) {
        errorLog("Cleanup error:", e);
    }
}

export async function initAudioModule() {
    try {
        await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: "duckOthers",
            shouldPlayInBackground: true,
        } as any);
    } catch (e) {
        errorLog("Audio module init error:", e);
    }
}

async function bootstrapAnalytics({
    version,
    build,
}: {
    version?: string;
    build?: string;
}) {
    try {
        // app_launched
        trackAmplitude("App Launched", {
            version,
            build,
        });

        // 첫 설치 1회
        const first = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (!first) {
            // app_install
            trackAmplitude("App Installed", {
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
            // app_updated
            trackAmplitude("App Updated", {
                from: lastVersion,
                to: version,
                build,
            });
        }
        await AsyncStorage.setItem(VERSION_KEY, version ?? "");
    } catch (e) {
        errorLog("Analytics bootstrap error:", e);
    }
}

export function useBootstrapApp(
    isLoggedIn: boolean,
    loadedFonts: boolean,
    testMode: boolean = true
) {
    const router = useRouter();
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<unknown>(null);

    const { requestOptional } = useAppPermissions();

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
                // 초기화
                await Promise.all([
                    initAudioModule(),
                    stopTrackingAndLiveActivity(),
                ]);

                Settings.initializeSDK();

                // 분석 로깅
                await bootstrapAnalytics({ version, build });

                // 라우팅
                if (cancelled) return;
                if (testMode) {
                    devLog("replace to /test");
                    router.replace("/profile/1389/preview");
                    // router.replace("/profile/1389/ghosty");
                    return;
                } else if (isLoggedIn) {
                    devLog("replace to /(tabs)/home");
                    router.replace("/(tabs)/home");
                } else {
                    devLog("replace to /(auth)/login");
                    router.replace("/(auth)/login");
                }

                // 스플래시 종료
                if (!cancelled) setStatus("done");

                InteractionManager.runAfterInteractions(async () => {
                    const res = await requestOptional("ADS");

                    const attGranted =
                        Platform.OS !== "ios"
                            ? true
                            : res.details?.after?.status ===
                                  PermissionStatus.GRANTED ||
                              res.details?.before?.status ===
                                  PermissionStatus.GRANTED;

                    if (Platform.OS === "ios") {
                        Settings.setAdvertiserTrackingEnabled(attGranted);
                    }

                    await initAds();
                });
            } catch (e) {
                errorLog(e);
                if (!cancelled) {
                    setError(e);
                    setStatus("error");
                    // 에러 시에도 스플래시는 닫아줌
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
