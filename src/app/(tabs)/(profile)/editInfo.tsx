import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore, UserInfo } from "@/src/store/authState";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export default function EditInfo() {
    const { userInfo: userInfoState, setUserInfo: setUserInfoState } =
        useAuthStore();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        setUserInfo(userInfoState);
    }, [userInfoState]);

    const onSubmit = () => {
        setUserInfoState(userInfo!);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <Header titleText="회원 정보 변경" />
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 17,
                    paddingTop: 20,
                    gap: 20,
                }}
            >
                {/* 닉네임 */}
                <InfoItem
                    title="닉네임"
                    placeholder={userInfo?.username ?? "닉네임"}
                    maxLength={10}
                    value={userInfo?.username ?? ""}
                    onChangeText={(text) => {
                        setUserInfo({
                            ...userInfo!,
                            username: text,
                        } as UserInfo);
                    }}
                    required
                />
                {/* 성별 */}
                <View style={{ gap: 3 }}>
                    <InfoFieldTitle title="성별" required />
                    <View style={{ flexDirection: "row", gap: 4, flex: 1 }}>
                        <StyledButton
                            title="여성"
                            onPress={() => {
                                if (userInfo?.gender === "FEMALE") {
                                    setUserInfo({
                                        ...userInfo!,
                                        gender: "",
                                    } as UserInfo);
                                } else {
                                    setUserInfo({
                                        ...userInfo!,
                                        gender: "FEMALE",
                                    } as UserInfo);
                                }
                            }}
                            style={{ paddingHorizontal: 12 }}
                            activeTextColor="primary"
                            active={userInfo?.gender === "FEMALE"}
                        />
                        <StyledButton
                            title="남성"
                            onPress={() => {
                                if (userInfo?.gender === "MALE") {
                                    setUserInfo({
                                        ...userInfo!,
                                        gender: "",
                                    } as UserInfo);
                                } else {
                                    setUserInfo({
                                        ...userInfo!,
                                        gender: "MALE",
                                    } as UserInfo);
                                }
                            }}
                            style={{ paddingHorizontal: 12 }}
                            activeTextColor="primary"
                            active={userInfo?.gender === "MALE"}
                        />
                    </View>
                </View>
                {/* 신장 */}
                <InfoItem
                    title="신장"
                    placeholder={userInfo?.height?.toString() ?? "ex) 170"}
                    keyboardType="numeric"
                    maxLength={3}
                    unit="cm"
                    value={userInfo?.height?.toString() ?? ""}
                    onChangeText={(text) => {
                        setUserInfo({
                            ...userInfo!,
                            height: Number(text),
                        } as UserInfo);
                    }}
                />
                {/* 몸무게 */}
                <InfoItem
                    title="몸무게"
                    placeholder={userInfo?.weight?.toString() ?? "ex) 60"}
                    keyboardType="numeric"
                    maxLength={3}
                    unit="kg"
                    value={userInfo?.weight?.toString() ?? ""}
                    onChangeText={(text) => {
                        setUserInfo({
                            ...userInfo!,
                            weight: Number(text),
                        } as UserInfo);
                    }}
                />
                <Typography
                    variant="caption1"
                    color="gray60"
                    style={{
                        marginTop: -14,
                    }}
                >
                    신체 스펙 입력시 더 정확한 데이터를 제공해 드릴 수 있습니다
                </Typography>
            </ScrollView>
            <BottomAgreementButton
                isActive={true}
                canPress={true}
                onPress={onSubmit}
                title="수정 완료"
            />
        </SafeAreaView>
    );
}
