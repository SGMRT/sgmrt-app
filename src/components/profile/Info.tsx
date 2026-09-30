import {
    getPresignedUrl,
    getUserInfo,
    patchUserInfo,
    patchUserSettings,
    uploadToS3,
} from "@/src/apis";
import { queryKeys } from "@/src/apis/queryKeys";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import { useLocalNotificationPermission } from "@/src/features/notifications/useLocalNotificationPermission";
import { useAuthStore } from "@/src/store/authState";
import { useLocalPrefs } from "@/src/store/localPrefs";
import colors from "@/src/theme/colors";
import { darkTheme } from "@/src/design-system/themes/dark";
import { pickImage } from "@/src/utils/pickImage";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileNoticeSection } from "../notice/ui/ProfileNoticeSection";
import { CadenceAssistGuide } from "../onboarding/CadenceAssistGuide";
import { ListSectionContainer, ListSectionItem, Typography, showToast } from "@/src/components/ui";
import { Button } from "@/src/design-system/atoms/Button";
import { Control } from "@/src/design-system/atoms/Control";
import { SplitAction } from "@/src/design-system/molecules/SplitAction";
import { spacing } from "@/src/design-system/tokens/spacing";
import { CadenceAssistControl } from "./CadenceAssistControl";
import { ProfileCard } from "./ProfileCard";

export const Info = ({
    setModalType,
    modalRef,
    scrollViewRef,
}: {
    setModalType: (type: "logout" | "withdraw") => void;
    modalRef: React.RefObject<BottomSheetModal | null>;
    scrollViewRef: React.RefObject<ScrollView | null>;
}) => {
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [cadenceAssistGuideShow, setCadenceAssistGuideShow] = useState(false);

    const { logout } = useAuthStore();
    const { granted, refresh } = useLocalNotificationPermission({
        withActiveRetry: true,
    });
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: userInfo,
        isLoading,
        isFetching,
        isRefetching,
        refetch,
    } = useQuery({
        queryKey: queryKeys.user.info(),
        queryFn: async () => {
            try {
                return await getUserInfo();
            } catch (e) {
                Alert.alert("회원 정보 조회 실패", "다시 시도해 주세요.", [
                    { text: "확인", onPress: logout },
                ]);
                throw e;
            }
        },
        staleTime: 1000 * 60 * 5,
    });

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const patchSettingsMutation = useMutation({
        mutationFn: (
            payload: Partial<
                Pick<
                    GetUserInfoResponse,
                    | "pushAlarmEnabled"
                    | "vibrationEnabled"
                    | "voiceGuidanceEnabled"
                >
            >
        ) => patchUserSettings(payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.user.info() });
            const prev = queryClient.getQueryData<GetUserInfoResponse>(
                queryKeys.user.info()
            );
            if (prev) {
                const next = { ...prev, ...payload };
                queryClient.setQueryData<GetUserInfoResponse>(
                    queryKeys.user.info(),
                    next
                );
            }
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) {
                queryClient.setQueryData<GetUserInfoResponse>(
                    queryKeys.user.info(),
                    ctx.prev
                );
            }
            showToast(
                "error",
                "서버 동기화에 실패했어요. 다시 시도해 주세요.",
                bottom
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.info() });
        },
    });

    const handlePushAlarmChange = async (next: boolean) => {
        if (next) {
            const perm = await Notifications.getPermissionsAsync();
            if (perm.status !== "granted") {
                const req = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                    },
                });
                if (req.status !== "granted") {
                    Alert.alert(
                        "알림 권한이 꺼져 있어요",
                        "설정에서 허용하시겠어요?",
                        [
                            { text: "취소", style: "destructive" },
                            {
                                text: "설정 열기",
                                onPress: () => Linking.openSettings(),
                            },
                        ]
                    );
                    return;
                }
            }
        }
        patchSettingsMutation.mutate({ pushAlarmEnabled: next });
    };

    // const handleVibrationChange = (value: boolean) => {
    //     if (!userInfo) return;
    //     setUserInfo({
    //         ...userInfo,
    //         vibrationEnabled: value ?? false,
    //     });
    //     setUserSettings({
    //         pushAlarmEnabled: userInfo.pushAlarmEnabled,
    //         vibrationEnabled: value ?? false,
    //         voiceGuidanceEnabled: userInfo.voiceGuidanceEnabled,
    //     });
    //     patchUserSettings({
    //         vibrationEnabled: value,
    //     });
    // };

    const handleSpeechChange = (value: boolean) => {
        patchSettingsMutation.mutate({ voiceGuidanceEnabled: value ?? false });
    };

    const patchProfileMutation = useMutation({
        mutationFn: async (fileUri: string) => {
            const image = { uri: fileUri } as { uri: string };
            const imageUrl = await getPresignedUrl({
                type: "MEMBER_PROFILE",
                fileName: image.uri.split("/").at(-1) ?? "",
            });
            const ok = await uploadToS3(image.uri, imageUrl.presignUrl);
            if (!ok) throw new Error("S3 업로드 실패");
            const finalUrl = imageUrl.presignUrl.split("?X-Amz-")[0];
            await patchUserInfo({ profileImageUrl: finalUrl });
            return finalUrl;
        },
        onSuccess: (finalUrl) => {
            queryClient.setQueryData<GetUserInfoResponse>(
                queryKeys.user.info(),
                (prev) => {
                    if (!prev) return prev as any;
                    return { ...prev, profilePictureUrl: finalUrl };
                }
            );
            showToast("success", "프로필 이미지가 변경되었습니다", bottom);
        },
        onError: () => {
            showToast(
                "error",
                "프로필 이미지 변경에 실패했어요. 다시 시도해 주세요.",
                bottom
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.info() });
        },
    });

    const onPickImage = async () => {
        const image = await pickImage();
        if (!image) return;
        patchProfileMutation.mutate(image.uri);
    };

    const isCadenceAssistEnabled = useLocalPrefs((s) => s.cadenceAssistEnabled);

    const handleCadenceAssistChange = (v: boolean) => {
        useLocalPrefs.getState().setCadenceAssistEnabled(v);
    };

    return (
        <>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{
                    marginHorizontal: spacing[16],
                    marginTop: spacing[20],
                    paddingBottom: spacing[8],
                    // 섹션끼리는 바짝 붙인다.
                    // 각 섹션이 사방 20 을 가지므로 사이까지 20 을 두면
                    // 가장자리 여백이 두 번 겹쳐 섹션이 서로 멀어진다.
                    gap: spacing[12],
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={!!refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            refetch().finally(() => {
                                setRefreshing(false);
                            });
                        }}
                    />
                }
            >
                {/* Profile */}
                <View style={{ marginTop: spacing[12] }}>
                    {/* isFetching 은 배경 갱신에도 참이라, 토글을 누를 때마다
                        회원 정보를 다시 부르는 동안 이름과 신체 정보가 빈칸이 되어
                        카드가 깜빡였다. 들고 있는 값이 없을 때만 빈칸으로 둔다. */}
                    <ProfileCard userInfo={userInfo ?? null} loading={isLoading} />
                    {/* 둘 다 "내 것을 고친다"는 한 갈래 안의 두 길이라
                        따로 떼지 않고 한 덩어리로 묶어 가운데만 가른다 */}
                    <SplitAction
                        left={{
                            label: "프로필 이미지 변경",
                            onPress: onPickImage,
                        }}
                        right={{
                            label: "회원 정보 변경",
                            onPress: () => {
                                router.push("/(tabs)/profile/editInfo");
                            },
                        }}
                    />
                </View>
                {/*  공지사항 및 이벤트 */}
                <ProfileNoticeSection
                    onPress={() => {
                        router.push("/(tabs)/profile/notice");
                    }}
                />
                {/* 러닝 중 동작 — 이 앱을 쓰는 가장 잦은 상황이라 맨 위에 둔다 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="음성 안내"
                        rightElement={
                            <Control
                                type="toggle"
                                status={
                                    userInfo?.voiceGuidanceEnabled ??
                                    false
                                }
                                onChange={handleSpeechChange}
                            />
                        }
                    />
                    <ListSectionItem
                        title="케이던스 보조"
                        onHintPress={() => {
                            setCadenceAssistGuideShow(true);
                        }}
                        rightElement={
                            <Control
                                type="toggle"
                                status={isCadenceAssistEnabled}
                                onChange={(v) => {
                                    handleCadenceAssistChange(v);
                                }}
                            />
                        }
                    />
                    <CadenceAssistControl isEnabled={isCadenceAssistEnabled} />
                </ListSectionContainer>

                {/* 앱 바깥과의 연결 — 기기 권한을 함께 쓰는 것들 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="알림"
                        rightElement={
                            <Control
                                type="toggle"
                                status={
                                    (userInfo?.pushAlarmEnabled && granted) ??
                                    false
                                }
                                onChange={(value) => {
                                    handlePushAlarmChange(value);
                                }}
                            />
                        }
                    />
                    <ListSectionItem
                        title="애플 건강 연동"
                        chevron
                        onPress={() => {
                            router.push("/(tabs)/profile/settings/health");
                        }}
                    />
                </ListSectionContainer>

                {/* 가끔 찾아보는 정보 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="법적 정보 및 기타"
                        chevron
                        onPress={() => {
                            router.push("/(tabs)/profile/settings/legal");
                        }}
                    />
                    <ListSectionItem
                        title="문의하기"
                        onPress={() => {
                            Linking.openURL(
                                "https://forms.gle/YhnuYBBqBD8beV4L6"
                            );
                        }}
                        chevron
                    />
                    <ListSectionItem
                        title="버전 정보"
                        rightElement={
                            /* 읽기만 하는 값이라 강조색을 쓰지 않는다.
                               옆 줄의 화살표와 같은 무게로 둬서
                               오른쪽 칸이 한 덩어리로 읽히게 한다.
                               화살표가 ui03 으로 내려갔으므로 함께 내린다. */
                            <Typography variant="body2" color="gray80">
                                {`${Application.nativeApplicationVersion}`}
                            </Typography>
                        }
                    />
                </ListSectionContainer>

                {/* 계정에서 빠져나가는 행동 — 되돌리기 어려우므로 맨 아래에 모은다 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="로그아웃"
                        titleColor="red"
                        onPress={() => {
                            setModalType("logout");
                            modalRef.current?.present();
                        }}
                        chevron
                    />
                </ListSectionContainer>
                <View />
                <TouchableOpacity
                    onPress={() => {
                        setModalType("withdraw");
                        modalRef.current?.present();
                    }}
                >
                    <Typography
                        variant="caption1"
                        color="gray80"
                        style={{ textAlign: "center" }}
                    >
                        탈퇴하기
                    </Typography>
                </TouchableOpacity>
            </ScrollView>

            <CadenceAssistGuide
                show={cadenceAssistGuideShow}
                handleClose={() => setCadenceAssistGuideShow(false)}
            />
        </>
    );
};
