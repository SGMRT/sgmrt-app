import { Logo, TouchText } from "@/assets/icons/icons";
import * as Sentry from "@sentry/react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Barometer, Pedometer } from "expo-sensors";
import {
    Alert,
    Button,
    Image,
    Linking,
    Pressable,
    StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBreathingAnimation } from "../animation/useBreathingAnimation";
import Compass from "../components/Compass";

export default function Index() {
    const breathingStyle = useBreathingAnimation();

    const router = useRouter();

    // Location, Pedometer 권한 받기
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

        let missingPermissions = [];
        if (!locationGranted) missingPermissions.push("위치");
        if (!pedometerGranted) missingPermissions.push("활동");
        if (!barometerGranted) missingPermissions.push("기압");

        const message = `${missingPermissions.join(
            ", "
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

    return (
        <Pressable
            style={styles.container}
            onPress={() => {
                requestPermissions().then((granted) => {
                    if (granted) {
                        router.replace("/(tabs)/home");
                    }
                });
            }}
        >
            <SafeAreaView style={styles.safeArea}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
                <Compass />
                <Button
                    title="Try!"
                    onPress={() => {
                        Sentry.captureException(new Error("First error"));
                    }}
                />
                <Animated.Image
                    source={TouchText}
                    style={[breathingStyle, styles.breathing]}
                    resizeMode="contain"
                />
            </SafeAreaView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    safeArea: {
        backgroundColor: "#111111",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        paddingVertical: 20,
    },
    logo: {
        width: 360,
        height: 156,
    },
    breathing: {
        width: 131,
        height: 33,
    },
});
