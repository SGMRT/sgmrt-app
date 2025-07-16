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
                    paddingHorizontal: 17,
                    gap: 8,
                    paddingVertical: 16,
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
                    title="[필수]  개인정보 수집 및 동의 "
                    isAgreed={agreement.privacyPolicyAgreed}
                    onPressAgree={() => {
                        toggleAgreement("privacyPolicyAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] 개인정보 수집 및 동의",
                                key: "privacyPolicyAgreed",
                            },
                        });
                    }}
                />
                <AgreeItem
                    title="[필수]  개인정보처리 위탁 동의"
                    isAgreed={agreement.dataConsignmentAgreed}
                    onPressAgree={() => {
                        toggleAgreement("dataConsignmentAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] 개인정보처리 위탁 동의",
                                key: "dataConsignmentAgreed",
                            },
                        });
                    }}
                />
                <AgreeItem
                    title="[필수] 제3자 정보 제공 동의"
                    isAgreed={agreement.thirdPartyDataSharingAgreed}
                    onPressAgree={() => {
                        toggleAgreement("thirdPartyDataSharingAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[필수] 제3자 정보 제공 동의",
                                key: "thirdPartyDataSharingAgreed",
                            },
                        });
                    }}
                />
                <AgreeItem
                    title="[선택] 마케팅 활용 동의"
                    isAgreed={agreement.marketingAgreed}
                    onPressAgree={() => {
                        toggleAgreement("marketingAgreed");
                    }}
                    onPressDetail={() => {
                        router.push({
                            pathname: "/register/termDetail",
                            params: {
                                title: "[선택] 마케팅 활용 동의",
                                key: "marketingAgreed",
                            },
                        });
                    }}
                />
            </ScrollView>
        </>
    );
}
