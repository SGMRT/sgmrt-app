import AgreeList from "@/src/components/sign/AgreeList";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { useAgreeState } from "@/src/hooks/useAgreeState";
import colors from "@/src/theme/colors";
import {
    Alert,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/src/store/authState";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";

// Location, Pedometer 권한 받기
async function requestPermissions(): Promise<boolean> {
    const locationPermission =
        await Location.requestForegroundPermissionsAsync();
    const pedometerPermission = await Pedometer.requestPermissionsAsync();

    const locationGranted = locationPermission.status === "granted";
    const pedometerGranted = pedometerPermission.status === "granted";

    if (locationGranted && pedometerGranted) {
        // TODO: 회원가입 API
        // 회원가입 성공
        return true;
    }

    let missingPermissions = [];
    if (!locationGranted) missingPermissions.push("위치");
    if (!pedometerGranted) missingPermissions.push("활동");

    const message = `${missingPermissions.join(
        "와 "
    )} 권한이 허용되지 않았습니다.\n\n서비스 이용을 위해 설정에서 권한을 허용해주세요.`;

    Alert.alert("권한이 부족해요", message, [
        { text: "취소", style: "cancel" },
        {
            text: "설정으로 이동",
            onPress: () => Linking.openSettings(),
        },
    ]);

    return false;
}

export default function Register() {
    const [agreeState, dispatch] = useAgreeState();
    const { login } = useAuthStore();
    const router = useRouter();

    const canRegister =
        agreeState.terms &&
        agreeState.privacy &&
        agreeState.consign &&
        agreeState.thirdparty;

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <Header titleText="회원가입" />
                <View style={{ height: 20 }} />
                <Typography
                    variant="display2"
                    color="white"
                    style={{ paddingHorizontal: 17 }}
                >
                    서비스 이용을 위해{"\n"}이용약관에 동의해 주세요
                </Typography>
                <View style={{ height: 18 }} />
                <AgreeList agreeState={agreeState} dispatch={dispatch} />
            </View>
            <TouchableOpacity
                onPress={async () => {
                    const result = await requestPermissions();
                    if (result) {
                        router.dismissAll();
                        login("accessToken", "refreshToken");
                        router.replace("/(tabs)/home");
                    }
                }}
            >
                <View
                    style={[
                        styles.button,
                        {
                            backgroundColor: canRegister
                                ? colors.primary
                                : "#333333",
                        },
                    ]}
                >
                    <Typography
                        variant="subhead2"
                        color={canRegister ? "black" : "white"}
                    >
                        동의하기
                    </Typography>
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    button: {
        width: "100%",
        height: 56,
        justifyContent: "center",
        alignItems: "center",
    },
});
