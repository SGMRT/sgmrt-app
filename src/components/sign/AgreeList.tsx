import { useSignupStore } from "@/src/store/signupStore";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import AgreeItem from "./AgreeItem";
import AgreementButton from "./AgreementButton";

export default function AgreeList() {
    const router = useRouter();
    const {
        agreement,
        allAgreementFullfilled,
        toggleAgreement,
        toggleAllAgreement,
    } = useSignupStore();

    return (
        <>
            <AgreementButton
                title="전체 동의"
                isAgreed={allAgreementFullfilled}
                onPress={() => toggleAllAgreement(!allAgreementFullfilled)}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    gap: 8,
                    paddingTop: 16,
                }}
            >
                <AgreeItem
                    title="[필수] Ghost Runner 서비스 이용약관"
                    isAgreed={agreement.serviceTermsAgreed}
                    onPressAgree={() => {
                        toggleAgreement("serviceTermsAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] Ghost Runner 서비스 이용약관",
                                key: "serviceTermsAgreed",
                            },
                        });
                    }}
                />
                <AgreeItem
                    title="[필수]  개인정보 처리방침"
                    isAgreed={agreement.privacyPolicyAgreed}
                    onPressAgree={() => {
                        toggleAgreement("privacyPolicyAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] 개인정보 처리방침",
                                key: "privacyPolicyAgreed",
                            },
                        });
                    }}
                />
                <AgreeItem
                    title="[필수]  개인정보 수집 및 이용 동의"
                    isAgreed={agreement.personalInformationUsageConsentAgreed}
                    onPressAgree={() => {
                        toggleAgreement(
                            "personalInformationUsageConsentAgreed"
                        );
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] 개인정보 수집 및 이용 동의",
                                key: "personalInformationUsageConsentAgreed",
                            },
                        });
                    }}
                />
            </ScrollView>
        </>
    );
}
