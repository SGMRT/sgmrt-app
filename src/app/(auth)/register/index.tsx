import AgreeList from "@/src/components/sign/AgreeList";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import { useAuthStore } from "@/src/store/authState";
import { useSignupStore } from "@/src/store/signupStore";
import { useRouter } from "expo-router";

// // Location, Pedometer 권한 받기
// async function requestPermissions(): Promise<boolean> {
//     const locationPermission =
//         await Location.requestForegroundPermissionsAsync();
//     const pedometerPermission = await Pedometer.requestPermissionsAsync();
//     const barometerPermission = await Barometer.requestPermissionsAsync();

//     const locationGranted = locationPermission.status === "granted";
//     const pedometerGranted = pedometerPermission.status === "granted";
//     const barometerGranted = barometerPermission.status === "granted";

//     if (locationGranted && pedometerGranted && barometerGranted) {
//         // TODO: 회원가입 API
//         // 회원가입 성공
//         return true;
//     }

//     let missingPermissions = [];
//     if (!locationGranted) missingPermissions.push("위치");
//     if (!pedometerGranted) missingPermissions.push("활동");
//     if (!barometerGranted) missingPermissions.push("기압");

//     const message = `${missingPermissions.join(
//         ", "
//     )} 권한이 허용되지 않았습니다.\n\n서비스 이용을 위해 설정에서 권한을 허용해주세요.`;

//     Alert.alert("권한이 부족해요", message, [
//         { text: "취소", style: "cancel" },
//         {
//             text: "설정으로 이동",
//             onPress: () => Linking.openSettings(),
//         },
//     ]);

//     return false;
// }

export default function Register() {
    const { login } = useAuthStore();
    const router = useRouter();
    const { agreementFullfilled } = useSignupStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <Header titleText="회원가입" />
                <View style={{ height: 20 }} />
                <Typography
                    variant="headline"
                    color="white"
                    style={{ paddingHorizontal: 17 }}
                >
                    서비스 이용을 위해{"\n"}이용약관에 동의해 주세요
                </Typography>
                <View style={{ height: 18 }} />
                <AgreeList />
            </View>
            <BottomAgreementButton
                isActive={agreementFullfilled}
                canPress={agreementFullfilled}
                onPress={async () => {
                    router.push("/register/profile");
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
});
