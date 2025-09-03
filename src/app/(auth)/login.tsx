import { Logo } from "@/assets/icons/icons";
import { AppleIcon, KakaoIcon } from "@/assets/svgs/svgs";
import { signIn } from "@/src/apis";
import LoginButton from "@/src/components/sign/LoginButton";
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
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Login() {
    const router = useRouter();

    const { login } = useAuthStore();

    initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? "");

    return (
        <SafeAreaView style={styles.container}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
            <View
                style={{
                    gap: 10,
                    paddingHorizontal: 16.5,
                    width: "100%",
                    height: 126,
                }}
            >
                <LoginButton
                    text="카카오로 시작하기"
                    backgroundColor="#fee500"
                    icon={<KakaoIcon />}
                    onPress={async () => {
                        const resp = await kakaoLogin();
                        if (!resp.idToken) {
                            Toast.show({
                                type: "info",
                                text1: "카카오 로그인 실패",
                                position: "bottom",
                            });
                            return;
                        }
                        await handleLogin({
                            providerId: "oidc.kakao",
                            token: resp.idToken,
                            secret: resp.accessToken,
                            router,
                            login,
                        });
                    }}
                />
                <LoginButton
                    text="애플로 시작하기"
                    backgroundColor="#3F3F3F"
                    textColor="white"
                    icon={<AppleIcon />}
                    onPress={async () => {
                        const resp = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                                AppleAuthentication.AppleAuthenticationScope
                                    .FULL_NAME,
                                AppleAuthentication.AppleAuthenticationScope
                                    .EMAIL,
                            ],
                        });
                        if (!resp.identityToken) {
                            Toast.show({
                                type: "info",
                                text1: "애플 로그인 실패",
                                position: "bottom",
                            });
                            return;
                        }
                        await handleLogin({
                            providerId: "apple.com",
                            token: resp.identityToken,
                            secret: resp.authorizationCode ?? "",
                            router,
                            login,
                        });
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

async function handleLogin({
    providerId,
    token,
    secret,
    router,
    login,
}: {
    providerId: string;
    token: string;
    secret?: string;
    router: ReturnType<typeof useRouter>;
    login: (accessToken: string, refreshToken: string, uuid: string) => void;
}) {
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

        amplitude.track("Sign In", {
            provider: providerId,
        });
    } catch (err: any) {
        console.log(err);
        if (err?.response?.status !== 404) {
            Toast.show({
                type: "info",
                text1: "로그인에 실패했습니다.",
                position: "bottom",
            });
        } else {
            router.push("/register");
            amplitude.track("Start Sign Up", {
                provider: providerId,
            });
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
