import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export default function EditInfo() {
    const [nickname, setNickname] = useState("");
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
                    placeholder="윤다희"
                    maxLength={10}
                    value={nickname}
                    onChangeText={setNickname}
                    required
                />
                {/* 성별 */}
                <View style={{ gap: 3 }}>
                    <InfoFieldTitle title="성별" required />
                    <View style={{ flexDirection: "row", gap: 4, flex: 1 }}>
                        <StyledButton
                            title="여성"
                            onPress={() => {}}
                            style={{ paddingHorizontal: 12 }}
                            activeTextColor="primary"
                            active={true}
                        />
                        <StyledButton
                            title="남성"
                            onPress={() => {}}
                            style={{ paddingHorizontal: 12 }}
                            activeTextColor="primary"
                            active={false}
                        />
                    </View>
                </View>
                {/* 신장 */}
                <InfoItem
                    title="신장"
                    placeholder="170"
                    keyboardType="numeric"
                    maxLength={3}
                    unit="cm"
                />
                {/* 몸무게 */}
                <InfoItem
                    title="몸무게"
                    placeholder="60"
                    keyboardType="numeric"
                    maxLength={3}
                    unit="kg"
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
                onPress={() => {}}
                title="수정 완료"
            />
        </SafeAreaView>
    );
}
