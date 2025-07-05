import { CheckIcon } from "@/assets/svgs/svgs";
import { AgreeAction, AgreeState } from "@/src/hooks/useAgreeState";
import colors from "@/src/theme/colors";
import { Dispatch } from "react";
import { TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Typography } from "../ui/Typography";
import AgreeItem from "./AgreeItem";

interface AgreeListProps {
    agreeState: AgreeState;
    dispatch: Dispatch<AgreeAction>;
}

export default function AgreeList({ agreeState, dispatch }: AgreeListProps) {
    const allAgreed = Object.values(agreeState).every(Boolean);

    const toggleAll = () => {
        dispatch({ type: "TOGGLE_ALL", value: !allAgreed });
    };

    return (
        <>
            <View
                style={{
                    width: "100%",
                    height: 60,
                    backgroundColor: "#171717",
                    justifyContent: "center",
                    paddingHorizontal: 17,
                }}
            >
                <TouchableOpacity onPress={toggleAll}>
                    <View
                        style={{
                            gap: 8,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                borderRadius: 100,
                                width: 26,
                                height: 26,
                                backgroundColor: allAgreed
                                    ? colors.primary
                                    : colors.gray[60],
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CheckIcon
                                color={
                                    allAgreed ? colors.black : colors.gray[20]
                                }
                            />
                        </View>
                        <Typography variant="headline" color="gray40">
                            전체 동의
                        </Typography>
                    </View>
                </TouchableOpacity>
            </View>
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
                    content="Ghost Runner 서비스 이용약관 내용"
                    isAgreed={agreeState.terms}
                    onPress={() => {
                        dispatch({ type: "TOGGLE_ITEM", key: "terms" });
                    }}
                />
                <AgreeItem
                    title="[필수]  개인정보 수집 및 동의 "
                    content="Ghost Runner 개인정보 수집 및 동의 내용"
                    isAgreed={agreeState.privacy}
                    onPress={() => {
                        dispatch({ type: "TOGGLE_ITEM", key: "privacy" });
                    }}
                />
                <AgreeItem
                    title="[필수]  개인정보처리 위탁 동의"
                    content="Ghost Runner 개인정보처리 위탁 동의 내용"
                    isAgreed={agreeState.consign}
                    onPress={() => {
                        dispatch({ type: "TOGGLE_ITEM", key: "consign" });
                    }}
                />
                <AgreeItem
                    title="[필수] 제3자 정보 제공 동의"
                    content="Ghost Runner 제3자 정보 제공 동의 내용"
                    isAgreed={agreeState.thirdparty}
                    onPress={() => {
                        dispatch({ type: "TOGGLE_ITEM", key: "thirdparty" });
                    }}
                />
                <AgreeItem
                    title="[선택] 마케팅 활용 동의"
                    content="Ghost Runner 마케팅 활용 동의 내용"
                    isAgreed={agreeState.marketing}
                    onPress={() => {
                        dispatch({ type: "TOGGLE_ITEM", key: "marketing" });
                    }}
                />
            </ScrollView>
        </>
    );
}
