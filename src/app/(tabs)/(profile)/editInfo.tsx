import { getUserInfo, patchUserInfo } from "@/src/apis";
import { PatchUserInfoRequest } from "@/src/apis/types/user";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    View,
} from "react-native";

export default function EditInfo() {
    const [userInfo, setUserInfo] = useState<PatchUserInfoRequest | null>(null);
    const [originalUserInfo, setOriginalUserInfo] =
        useState<PatchUserInfoRequest | null>(null);
    const [updateUserInfo, setUpdateUserInfo] =
        useState<PatchUserInfoRequest | null>(null);

    useEffect(() => {
        getUserInfo().then((res) => {
            setUserInfo(res as PatchUserInfoRequest);
            setOriginalUserInfo(res as PatchUserInfoRequest);
        });
    }, []);

    const isActive = useMemo(() => {
        return (
            userInfo?.nickname !== originalUserInfo?.nickname ||
            userInfo?.gender !== originalUserInfo?.gender ||
            userInfo?.age !== originalUserInfo?.age ||
            userInfo?.height !== originalUserInfo?.height ||
            userInfo?.weight !== originalUserInfo?.weight
        );
    }, [userInfo, originalUserInfo]);

    const onSubmit = () => {
        if (!updateUserInfo) return;
        // originalUserInfo와 updateUserInfo를 비교하여 변경된 부분만 전송
        const changedFields = Object.entries(updateUserInfo).filter(
            ([key, value]) =>
                value !== originalUserInfo?.[key as keyof PatchUserInfoRequest]
        );
        const changedFieldsObject = Object.fromEntries(changedFields);

        if (Object.keys(changedFieldsObject).length === 0) {
            Alert.alert("회원 정보 변경 실패", "변경된 정보가 없습니다.");
            return;
        }

        patchUserInfo(changedFieldsObject)
            .then(() => {
                Alert.alert(
                    "회원 정보 변경 완료",
                    "회원 정보를 변경했습니다.",
                    [
                        {
                            text: "확인",
                            onPress: () => {
                                router.back();
                            },
                        },
                    ]
                );
            })
            .catch((err) => {
                Alert.alert("회원 정보 변경 실패", err.response.data.message, [
                    {
                        text: "확인",
                    },
                ]);
            });
    };

    const handleUpdateUserInfo = (
        key: keyof PatchUserInfoRequest,
        value: string
    ) => {
        setUpdateUserInfo({
            ...updateUserInfo!,
            [key]: value,
        } as PatchUserInfoRequest);
        setUserInfo({
            ...userInfo!,
            [key]: value,
        } as PatchUserInfoRequest);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
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
                        placeholder={userInfo?.nickname ?? "닉네임"}
                        maxLength={10}
                        value={userInfo?.nickname ?? ""}
                        onChangeText={(text) => {
                            handleUpdateUserInfo("nickname", text);
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
                                    handleUpdateUserInfo("gender", "FEMALE");
                                }}
                                style={{ paddingHorizontal: 12 }}
                                activeTextColor="primary"
                                active={userInfo?.gender === "FEMALE"}
                            />
                            <StyledButton
                                title="남성"
                                onPress={() => {
                                    handleUpdateUserInfo("gender", "MALE");
                                }}
                                style={{ paddingHorizontal: 12 }}
                                activeTextColor="primary"
                                active={userInfo?.gender === "MALE"}
                            />
                        </View>
                    </View>
                    {/* 연령 */}
                    <InfoItem
                        title="연령"
                        placeholder={userInfo?.age?.toString() ?? "ex) 20"}
                        keyboardType="numeric"
                        maxLength={3}
                        unit="세"
                        value={userInfo?.age?.toString() ?? ""}
                        onChangeText={(text) => {
                            handleUpdateUserInfo("age", text);
                        }}
                    />
                    {/* 신장 */}
                    <InfoItem
                        title="신장"
                        placeholder={userInfo?.height?.toString() ?? "ex) 170"}
                        keyboardType="numeric"
                        maxLength={3}
                        unit="cm"
                        value={userInfo?.height?.toString() ?? ""}
                        onChangeText={(text) => {
                            handleUpdateUserInfo("height", text);
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
                            handleUpdateUserInfo("weight", text);
                        }}
                    />
                    <Typography
                        variant="caption1"
                        color="gray60"
                        style={{
                            marginTop: -14,
                        }}
                    >
                        신체 스펙 입력시 더 정확한 데이터를 제공해 드릴 수
                        있습니다
                    </Typography>
                </ScrollView>
                <BottomAgreementButton
                    isActive={isActive}
                    canPress={isActive}
                    onPress={onSubmit}
                    title="수정 완료"
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
