import AgreeList from "@/src/components/sign/AgreeList";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import { useSignupStore } from "@/src/store/signupStore";
import { useRouter } from "expo-router";

/**
 * Registration agreement screen component.
 *
 * Renders the sign-up terms agreement UI: header, instruction text, list of agreements,
 * and a bottom action button that becomes active when all required agreements are fulfilled.
 * When active and pressed, the button navigates to the profile setup route ("/register/profile").
 *
 * @returns The Register screen as a React element.
 */
export default function Register() {
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
                    style={{ paddingHorizontal: 16 }}
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
