import { Logo } from "@/assets/icons/icons";
import { AppleIcon, KakaoIcon } from "@/assets/svgs/svgs";
import { signIn } from "@/src/apis";
import Compass from "@/src/components/Compass";
import LoginButton from "@/src/components/sign/LoginButton";
import { useAuthStore } from "@/src/store/authState";
import { getAuth, signInWithCredential } from "@react-native-firebase/auth";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { login as kakaoLogin } from "@react-native-kakao/user";
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
            <Compass />
            <View style={{ width: "100%", gap: 8 }}>
                <LoginButton
                    text="카카오로 시작하기"
                    backgroundColor="#fee500"
                    icon={<KakaoIcon />}
                    onPress={async () => {
                        const kakaoAuthRequestResponse = await kakaoLogin();

                        if (!kakaoAuthRequestResponse.idToken) {
                            Toast.show({
                                type: "info",
                                text1: "카카오 로그인 실패",
                                position: "bottom",
                            });
                            return;
                        }

                        const credential = await signInWithCredential(
                            getAuth(),
                            {
                                providerId: "oidc.kakao",
                                token: kakaoAuthRequestResponse.idToken,
                                secret: kakaoAuthRequestResponse.accessToken,
                            }
                        );

                        signIn({
                            idToken: await credential.user.getIdToken(),
                        })
                            .then((res) => {
                                login(
                                    res.accessToken,
                                    res.refreshToken,
                                    res.uuid
                                );
                            })
                            .catch((err) => {
                                console.log(err);
                                if (err.response.status !== 404) {
                                    Toast.show({
                                        type: "info",
                                        text1: "로그인에 실패했습니다.",
                                        position: "bottom",
                                    });
                                    return;
                                } else {
                                    router.push("/register");
                                    return;
                                }
                            });
                    }}
                />
                <LoginButton
                    text="애플로 시작하기"
                    backgroundColor="#333333"
                    textColor="white"
                    icon={<AppleIcon />}
                    onPress={async () => {
                        const appleAuthRequestResponse =
                            await AppleAuthentication.signInAsync({
                                requestedScopes: [
                                    AppleAuthentication.AppleAuthenticationScope
                                        .FULL_NAME,
                                    AppleAuthentication.AppleAuthenticationScope
                                        .EMAIL,
                                ],
                            });

                        if (!appleAuthRequestResponse.identityToken) {
                            Toast.show({
                                type: "info",
                                text1: "애플 로그인 실패",
                                position: "bottom",
                            });
                            return;
                        }

                        const credential = await signInWithCredential(
                            getAuth(),
                            {
                                providerId: "apple.com",
                                token: appleAuthRequestResponse.identityToken,
                                secret:
                                    appleAuthRequestResponse.authorizationCode ??
                                    "",
                            }
                        );

                        signIn({
                            idToken: await credential.user.getIdToken(),
                        })
                            .then((res) => {
                                console.log(res);
                                login(
                                    res.accessToken,
                                    res.refreshToken,
                                    res.uuid
                                );
                            })
                            .catch((err) => {
                                console.log(err);
                                if (err.response.status !== 404) {
                                    Toast.show({
                                        type: "info",
                                        text1: "로그인에 실패했습니다.",
                                        position: "bottom",
                                    });
                                    return;
                                } else {
                                    router.push("/register");
                                    return;
                                }
                            });
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111111",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 20,
    },
    logo: {
        width: 360,
        height: 156,
    },
});
