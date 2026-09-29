import { getUserInfo, patchUserInfo } from "@/src/apis";
import {
    GetUserInfoResponse,
    PatchUserInfoRequest,
} from "@/src/apis/types/user";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import { Header, Typography, showToast } from "@/src/components/ui";
import { Button } from "@/src/design-system/atoms/Button";
import { FieldLabel } from "@/src/design-system/atoms/FieldLabel";
import { Input } from "@/src/design-system/atoms/Input";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
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

    const hasChanges = useMemo(() => {
        if (!origin || !userInfo) return false;
        return (
            userInfo.nickname !== origin.nickname ||
            userInfo.gender !== origin.gender ||
            userInfo.age !== origin.age ||
            userInfo.height !== origin.height ||
            userInfo.weight !== origin.weight
        );
    }, [origin, userInfo]);

    // 특수문자 검사 regex
    const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    // 숫자만 입력 가능 regex
    const numberOnlyRegex = /^[0-9]*$/;

    const nickname = userInfo?.nickname ?? "";
    const age = userInfo?.age?.toString() ?? "";
    const height = userInfo?.height?.toString() ?? "";
    const weight = userInfo?.weight?.toString() ?? "";

    // 입력한 값이 규칙을 어겼는지. 비어 있을 때는 아직 나무라지 않는다
    const nicknameError =
        nickname.length > 0 && specialCharacterRegex.test(nickname);
    const ageError = age.length > 0 && !numberOnlyRegex.test(age);

    // 바뀐 것이 있고, 바뀐 값이 규칙에 맞아야 누를 수 있다.
    // 회원가입 화면과 같은 검사를 쓴다. 지금까지는 이 화면에만 검사가 없어
    // 가입할 때는 막히는 값이 정보 변경에서는 통과했다.
    // 연령도 회원가입과 같이 필수로 둔다.
    const isActive =
        hasChanges &&
        nickname.length > 0 &&
        !nicknameError &&
        age.length > 0 &&
        !ageError &&
        (height === "" || numberOnlyRegex.test(height)) &&
        (weight === "" || numberOnlyRegex.test(weight));

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
            Alert.alert("회원 정보 변경 실패", "다시 시도해 주세요.");
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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <Header titleText="회원 정보 변경" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContentContainer}
                >
                    <View style={styles.fields}>
                        {/* 닉네임 */}
                        <Input
                            label="닉네임"
                            required
                            labelPosition="outside"
                            placeholder="특수문자 제외 최대 10자"
                            maxLength={10}
                            value={userInfo?.nickname ?? ""}
                            onChangeText={(text) => {
                                handleUpdateUserInfo("nickname", text);
                            }}
                            counter
                            error={nicknameError}
                            message={
                                nicknameError
                                    ? "특수문자는 사용할 수 없습니다"
                                    : undefined
                            }
                        />
                        {/* 성별 */}
                        <View>
                            <FieldLabel label="성별" required />
                            <View style={styles.genderButtonContainer}>
                                <Button
                                    title="여성"
                                    onPress={() => {
                                        handleUpdateUserInfo(
                                            "gender",
                                            "FEMALE"
                                        );
                                    }}
                                    size="large"
                                    theme="ui01"
                                    selected={userInfo?.gender === "FEMALE"}
                                    style={styles.genderButton}
                                />
                                <Button
                                    title="남성"
                                    onPress={() => {
                                        handleUpdateUserInfo("gender", "MALE");
                                    }}
                                    size="large"
                                    theme="ui01"
                                    selected={userInfo?.gender === "MALE"}
                                    style={styles.genderButton}
                                />
                            </View>
                        </View>
                        {/* 연령 */}
                        <Input
                            label="연령"
                            required
                            labelPosition="outside"
                            placeholder="숫자 입력 (예: 20)"
                            keyboardType="numeric"
                            maxLength={3}
                            unit="세"
                            value={userInfo?.age?.toString() ?? ""}
                            onChangeText={(text) => {
                                handleUpdateUserInfo("age", text);
                            }}
                            error={ageError}
                            message={
                                ageError ? "숫자만 입력해 주세요" : undefined
                            }
                        />
                        {/* 신장 */}
                        <Input
                            label="신장"
                            labelPosition="outside"
                            placeholder="소수점 제외 입력 (예: 172)"
                            keyboardType="numeric"
                            maxLength={3}
                            unit="cm"
                            value={userInfo?.height?.toString() ?? ""}
                            onChangeText={(text) => {
                                handleUpdateUserInfo("height", text);
                            }}
                        />
                        {/* 몸무게 */}
                        <View>
                            <Input
                                label="몸무게"
                                labelPosition="outside"
                                placeholder="소수점 제외 입력 (예: 60)"
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
                                style={{ paddingTop: spacing[12] }}
                            >
                                신체 정보를 입력하시면 더 정확한 기록을 제공해
                                드릴 수 있습니다
                            </Typography>
                        </View>
                    </View>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.uiBackground,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContentContainer: {
        paddingHorizontal: spacing[16],
        marginTop: spacing[20],
        paddingBottom: spacing[32],
    },
    fields: {
        gap: spacing[20],
    },
    genderButtonContainer: {
        flexDirection: "row",
        gap: spacing[8],
    },
    // Button 이 크기를 직접 들고 있으므로 여기서는 폭만 나눈다
    genderButton: {
        flex: 1,
    },
});
