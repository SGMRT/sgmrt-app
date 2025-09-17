import { Logo } from "@/assets/icons/icons";
import { AppleIcon, KakaoIcon } from "@/assets/svgs/svgs";
import { getUserInfo, signIn } from "@/src/apis";
import LoginButton from "@/src/components/sign/LoginButton";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import { showToast } from "@/src/components/ui/toastConfig";
import { useAuthStore } from "@/src/store/authState";
import * as amplitude from "@amplitude/analytics-react-native";
import { getAuth, signInWithCredential } from "@react-native-firebase/auth";
import {
    getCrashlytics,
    setAttributes,
    setUserId,
} from "@react-native-firebase/crashlytics";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { login as kakaoLogin } from "@react-native-kakao/user";
import * as Sentry from "@sentry/react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

let loginInFlight = false;

export default function Login() {
    const router = useRouter();
    const { login } = useAuthStore();
    const { bottom } = useSafeAreaInsets();

    const [loadingProvider, setLoadingProvider] = useState<
        null | "kakao" | "apple"
    >(null);

    useEffect(() => {
        initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? "");
    }, []);

    const doLogin = async (args: {
        providerId: string;
        token: string;
        secret: string;
    }) => {
        if (loginInFlight) return;
        loginInFlight = true;
        try {
            await handleLogin({
                ...args,
                login,
                bottom,
            }).catch((err) => {
                if (err.needsSignup) {
                    router.push("/(auth)/register");
                }
            });
        } finally {
            loginInFlight = false;
        }
    };

    return (
        <>
            {loadingProvider && <LoadingLayer />}
            <SafeAreaView style={styles.container}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
                <View
                    style={{
                        gap: 10,
                        width: "100%",
                    }}
                >
                    <LoginButton
                        text="카카오로 시작하기"
                        backgroundColor="#fee500"
                        icon={<KakaoIcon />}
                        onPress={async () => {
                            if (loadingProvider) return;

                            try {
                                const resp = await kakaoLogin();
                                setLoadingProvider("kakao");
                                if (!resp.idToken) {
                                    showToast(
                                        "info",
                                        "카카오 로그인 실패",
                                        bottom
                                    );
                                    return;
                                }
                                await doLogin({
                                    providerId: "oidc.kakao",
                                    token: resp.idToken,
                                    secret: resp.accessToken,
                                });
                            } catch (e) {
                                showToast("info", "카카오 로그인 실패", bottom);
                            } finally {
                                setLoadingProvider(null);
                            }
                        }}
                    />
                    {Platform.OS === "ios" && (
                        <LoginButton
                            text="애플로 시작하기"
                            backgroundColor="#3F3F3F"
                            textColor="white"
                            icon={<AppleIcon />}
                            disabled={loadingProvider !== null}
                            onPress={async () => {
                                if (loadingProvider) return;

                                try {
                                    const resp =
                                        await AppleAuthentication.signInAsync({
                                            requestedScopes: [
                                                AppleAuthentication
                                                    .AppleAuthenticationScope
                                                    .FULL_NAME,
                                                AppleAuthentication
                                                    .AppleAuthenticationScope
                                                    .EMAIL,
                                            ],
                                        });
                                    setLoadingProvider("apple");
                                    if (!resp.identityToken) {
                                        showToast(
                                            "info",
                                            "애플 로그인 실패",
                                            bottom
                                        );
                                        return;
                                    }
                                    await doLogin({
                                        providerId: "apple.com",
                                        token: resp.identityToken,
                                        secret: resp.authorizationCode ?? "",
                                    });
                                } catch (e: any) {
                                    showToast(
                                        "info",
                                        "애플 로그인 실패",
                                        bottom
                                    );
                                } finally {
                                    setLoadingProvider(null);
                                }
                            }}
                        />
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}

async function handleLogin({
    providerId,
    token,
    secret,
    login,
    bottom,
}: {
    providerId: string;
    token: string;
    secret?: string;
    login: (accessToken: string, refreshToken: string, uuid: string) => void;
    bottom: number;
}) {
    const { setUserInfo: setUserInfoStore } = useAuthStore.getState();
    const { setUserSettings: setUserSettingsStore } = useAuthStore.getState();

    try {
        const credential = await signInWithCredential(getAuth(), {
            providerId,
            token,
            secret: secret ?? "",
        });

        Sentry.setUser({
            id: credential.user.uid,
            provider: providerId,
            email: credential.user.email ?? "",
        });

        const crashlytics = getCrashlytics();
        setUserId(crashlytics, credential.user.uid);
        setAttributes(crashlytics, {
            provider: providerId,
            email: credential.user.email ?? "",
        });

        amplitude.setUserId(credential.user.uid);
        amplitude.setGroup("provider", providerId);

        const res = await signIn({
            idToken: await credential.user.getIdToken(),
        });

        login(res.accessToken, res.refreshToken, res.uuid);

        const ui = await getUserInfo();
        setUserInfoStore({
            username: ui.nickname,
            gender: ui.gender,
            age: ui.age,
            height: ui.height,
            weight: ui.weight,
        });
        setUserSettingsStore({
            pushAlarmEnabled: ui.pushAlarmEnabled,
            vibrationEnabled: ui.vibrationEnabled,
            voiceGuidanceEnabled: ui.voiceGuidanceEnabled,
        });

        amplitude.track("Sign In", { provider: providerId });
    } catch (err: any) {
        console.log(err);
        if (err?.response?.status !== 404) {
            showToast("info", "로그인에 실패했습니다.", bottom);
            throw err;
        } else {
            amplitude.track("Start Sign Up", { provider: providerId });
            throw { needsSignup: true };
        }
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111111",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 20,
        width: "100%",
    },
    logo: {
        width: 274.75,
        height: 63.44,
        flex: 1,
    },
});
