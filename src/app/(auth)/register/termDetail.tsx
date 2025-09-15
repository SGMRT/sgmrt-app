import { getDataFromS3 } from "@/src/apis";
import AgreementButton from "@/src/components/sign/AgreementButton";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { useSignupStore } from "@/src/store/signupStore";
import colors from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermDetail() {
    const { title, key } = useLocalSearchParams();
    const { agreement, toggleAgreement } = useSignupStore();

    const [content, setContent] = useState("");

    const isAgreed = agreement[key as keyof typeof agreement] as boolean;
    const onPressAgree = () => {
        toggleAgreement(key as keyof typeof agreement);
    };

    useEffect(() => {
        switch (key) {
            case "serviceTermsAgreed":
                getDataFromS3(
                    "https://ghostrunner-dev-bucket.s3.ap-northeast-2.amazonaws.com/terms-and-conditions/service-terms.txt"
                ).then((data) => {
                    setContent(data!);
                });
                break;
            case "privacyPolicyAgreed":
                getDataFromS3(
                    "https://ghostrunner-dev-bucket.s3.ap-northeast-2.amazonaws.com/terms-and-conditions/privacy-policy.txt"
                ).then((data) => {
                    setContent(data!);
                });
                break;
            case "personalInformationUsageConsentAgreed":
                getDataFromS3(
                    "https://ghostrunner-dev-bucket.s3.ap-northeast-2.amazonaws.com/terms-and-conditions/personal-information-usage-consent.txt"
                ).then((data) => {
                    setContent(data!);
                });
                break;
        }
    }, [key]);

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
                    paddingBottom: 50,
                }}
            >
                <Markdown style={markdownStyles}>{content}</Markdown>
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

const markdownStyles = StyleSheet.create({
    // 일반(공통)
    body: {
        color: colors.gray[40],
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.6,
    },
    // ###
    heading3: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 18,
        lineHeight: 27,
    },
    // **
    strong: {
        fontFamily: "SpoqaHanSansNeo-Bold",
    },
    table: {
        borderColor: colors.gray[40],
        textAlign: "center",
    },
    thead: {
        backgroundColor: colors.gray[80],
        borderColor: colors.gray[40],
        borderBottomWidth: 0.3,
        fontFamily: "SpoqaHanSansNeo-Bold",
    },
    tr: {
        borderColor: colors.gray[40],
    },
});
