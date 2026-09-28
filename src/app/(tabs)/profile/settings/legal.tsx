import { ChevronIcon } from "@/assets/svgs/svgs";
import { Header, ListSectionContainer, ListSectionItem } from "@/src/components/ui";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, View } from "react-native";

export default function Legal() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="법적 정보 및 기타" />
            <View style={styles.content}>
                <ListSectionContainer>
                    <ListSectionItem
                        title="서비스 이용약관"
                        onPress={() => {
                            router.push({
                                pathname: "/(tabs)/profile/termDetail",
                                params: {
                                    key: "serviceTermsAgreed",
                                },
                            });
                        }}
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                    />
                    <ListSectionItem
                        title="개인정보 처리방침"
                        onPress={() => {
                            router.push({
                                pathname: "/(tabs)/profile/termDetail",
                                params: {
                                    key: "privacyPolicyAgreed",
                                },
                            });
                        }}
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                    />
                    <ListSectionItem
                        title="개인정보 수집 및 이용 동의"
                        onPress={() => {
                            router.push({
                                pathname: "/(tabs)/profile/termDetail",
                                params: {
                                    key: "personalInformationUsageConsentAgreed",
                                },
                            });
                        }}
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                    />
                </ListSectionContainer>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.uiBackground,
    },
    content: {
        marginTop: spacing[20],
        paddingHorizontal: spacing[16],
    },
});
