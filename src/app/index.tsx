import { Logo, TouchText } from "@/assets/icons/icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBreathingAnimation } from "../animation/useBreathingAnimation";
import Compass from "../components/Compass";

export default function Index() {
    const breathingStyle = useBreathingAnimation();

    const router = useRouter();

    return (
        <Pressable
            style={styles.container}
            onPress={() => {
                router.replace("/(tabs)/home");
            }}
        >
            <SafeAreaView style={styles.safeArea}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
                <Compass />
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
        justifyContent: "center",
        paddingHorizontal: 17,
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
