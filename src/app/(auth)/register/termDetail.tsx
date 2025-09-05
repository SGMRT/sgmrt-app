import AgreementButton from "@/src/components/sign/AgreementButton";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { useSignupStore } from "@/src/store/signupStore";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Screen that displays term details for a given agreement key and lets the user toggle consent.
 *
 * Renders a header, the term title, an agreement button bound to the signup store's agreement state,
 * the term content inside a scrollable view, and a bottom gradient overlay. Reads `title` and `key`
 * from local search params and calls `toggleAgreement(key)` when the user presses the agreement button.
 */
export default function TermDetail() {
    const { title, key } = useLocalSearchParams();
    const { agreement, toggleAgreement } = useSignupStore();

    const isAgreed = agreement[key as keyof typeof agreement] as boolean;
    const onPressAgree = () => {
        toggleAgreement(key as keyof typeof agreement);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header titleText="서비스 이용약관" />
            <View style={{ height: 20 }} />
            <Typography
                variant="headline"
                color="white"
                style={{ paddingHorizontal: 16 }}
            >
                {title}
            </Typography>
            <View style={{ height: 18 }} />
            <AgreementButton
                title="동의"
                isAgreed={isAgreed}
                onPress={onPressAgree}
            />
            <ScrollView
                style={{ flex: 1, marginTop: 16 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                }}
            >
                <Typography variant="body2" color="gray40">
                    {title}
                </Typography>
            </ScrollView>
            <LinearGradient
                colors={["rgba(24,24,24,1)", "rgba(24,24,24,0)"]}
                locations={[0, 1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradient}
            />
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
    gradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
});
