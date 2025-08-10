import AgreementButton from "@/src/components/sign/AgreementButton";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { useSignupStore } from "@/src/store/signupStore";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermDetail() {
    const { title, key } = useLocalSearchParams();
    const { agreement, toggleAgreement } = useSignupStore();

    const isAgreed = agreement[key as keyof typeof agreement] as boolean;
    const onPressAgree = () => {
        toggleAgreement(key as keyof typeof agreement);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="서비스 이용약관" />
            <View style={{ height: 20 }} />
            <Typography
                variant="headline"
                color="white"
                style={{ paddingHorizontal: 17 }}
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
                style={{ flex: 1 }}
                contentContainerStyle={{
                    marginTop: 16,
                    paddingHorizontal: 15,
                }}
            >
                <Typography variant="body2" color="gray40">
                    {title}
                </Typography>
            </ScrollView>
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
