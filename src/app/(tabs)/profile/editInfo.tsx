import { getUserInfo, patchUserInfo } from "@/src/apis";
import {
    GetUserInfoResponse,
    PatchUserInfoRequest,
} from "@/src/apis/types/user";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { showToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditInfo() {
    const queryClient = useQueryClient();
    const { bottom } = useSafeAreaInsets();

    const { data: origin } = useQuery({
        queryKey: ["user", "info"],
        queryFn: getUserInfo,
        staleTime: 1000 * 60 * 3,
    });

    const [userInfo, setUserInfo] = useState<PatchUserInfoRequest | null>(null);
    useEffect(() => {
        if (origin) {
            // 서버 스키마 → Patch 스키마로 맵핑 필요 시 여기서
            setUserInfo({
                nickname: origin.nickname ?? "",
                gender: origin.gender as PatchUserInfoRequest["gender"],
                age: origin.age,
                height: origin.height,
                weight: origin.weight,
            });
        }
    }, [origin]);

    const isActive = useMemo(() => {
        if (!origin || !userInfo) return false;
        return (
            userInfo.nickname !== origin.nickname ||
            userInfo.gender !== origin.gender ||
            userInfo.age !== origin.age ||
            userInfo.height !== origin.height ||
            userInfo.weight !== origin.weight
        );
    }, [origin, userInfo]);

    // 변경된 부분만 전송
    const diff = (next: PatchUserInfoRequest, prev: GetUserInfoResponse) => {
        const toNum = (v: unknown) => {
            if (typeof v !== "string") return v as number | null | undefined;
            const s = v.trim();
            if (s === "") return undefined;
            const n = Number(s);
            return Number.isFinite(n) ? n : undefined;
        };
        const changed: Partial<PatchUserInfoRequest> = {};
        const nextNickname = (next.nickname ?? "").trim();
        if (nextNickname !== (prev.nickname ?? ""))
            changed.nickname = nextNickname;
        if (next.gender !== prev.gender) changed.gender = next.gender;
        (["age", "height", "weight"] as const).forEach((k) => {
            const nv = toNum((next as any)[k]);
            const pv = (prev as any)[k];
            if (nv === undefined) return; // 빈값/잘못된 값은 전송하지 않음
            if (nv !== pv) (changed as any)[k] = nv;
        });
        return changed;
    };
    // 회원 정보 변경 뮤테이션
    const saveMutation = useMutation({
        mutationFn: async (payload: Partial<PatchUserInfoRequest>) =>
            patchUserInfo(payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: ["user", "info"] });
            const previous = queryClient.getQueryData<GetUserInfoResponse>([
                "user",
                "info",
            ]);

            // 낙관적 merge
            if (previous) {
                queryClient.setQueryData<GetUserInfoResponse>(
                    ["user", "info"],
                    {
                        ...previous,
                        ...payload,
                    } as GetUserInfoResponse
                );
            }
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.previous)
                queryClient.setQueryData(["user", "info"], ctx.previous);
            Alert.alert("회원 정보 변경 실패", "다시 시도해주세요.");
        },
        onSuccess: () => {
            showToast("success", "회원 정보가 변경되었습니다.", bottom);
            router.back();
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["user", "info"] });
        },
    });

    const onSubmit = () => {
        if (!origin || !userInfo) return;
        const payload = diff(userInfo, origin);
        if (Object.keys(payload).length === 0) {
            Alert.alert("회원 정보 변경 실패", "변경된 정보가 없습니다.");
            return;
        }

        saveMutation.mutate(payload);
    };

    const handleUpdateUserInfo = (
        key: keyof PatchUserInfoRequest,
        value: string
    ) => {
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
                    topStroke
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
