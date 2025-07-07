import { Logo } from "@/assets/icons/icons";
import { AppleIcon, KakaoIcon } from "@/assets/svgs/svgs";
import Compass from "@/src/components/Compass";
import LoginButton from "@/src/components/sign/LoginButton";
import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
            <Compass />
            <View style={{ width: "100%", gap: 8 }}>
                <LoginButton
                    text="카카오로 시작하기"
                    backgroundColor="#fee500"
                    icon={<KakaoIcon />}
                    onPress={() => {
                        router.push("/register");
                    }}
                />
                <LoginButton
                    text="애플로 시작하기"
                    backgroundColor="#333333"
                    textColor="white"
                    icon={<AppleIcon />}
                    onPress={() => {
                        router.push("/register");
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
