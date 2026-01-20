import { ChevronIcon } from "@/assets/svgs/svgs";
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
import { ListSectionContainer, ListSectionItem, StyledButton, StyledSwitch, Typography, showToast } from "@/src/components/ui";
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
        isFetching,
        isRefetching,
        refetch,
    } = useQuery({
        queryKey: queryKeys.user.info(),
        queryFn: async () => {
            try {
                return await getUserInfo();
            } catch (e) {
                Alert.alert("회원 정보 조회 실패", "다시 시도해주세요.", [
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
                "info",
                "서버 동기화에 실패했어요. 다시 시도해주세요.",
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
                "info",
                "프로필 이미지 변경에 실패했어요. 다시 시도해주세요.",
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
                    marginHorizontal: 17,
                    marginTop: 20,
                    paddingBottom: 10,
                    gap: 20,
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
                <View style={{ gap: 15, marginTop: 10 }}>
                    <ProfileCard userInfo={userInfo ?? null} loading={isFetching} />
                    <View style={{ flexDirection: "row", gap: 4 }}>
                        <StyledButton
                            title="프로필 이미지 변경"
                            onPress={onPickImage}
                            style={{ width: "50%" }}
                        />
                        <StyledButton
                            title="회원 정보 변경"
                            onPress={() => {
                                router.push("/(tabs)/profile/editInfo");
                            }}
                            style={{ width: "50%" }}
                        />
                    </View>
                </View>
                {/*  공지사항 및 이벤트 */}
                <ProfileNoticeSection
                    onPress={() => {
                        router.push("/(tabs)/profile/notice");
                    }}
                />
                {/* 디바이스 옵션 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="알림"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    (userInfo?.pushAlarmEnabled && granted) ??
                                    false
                                }
                                onValueChange={(value) => {
                                    handlePushAlarmChange(value);
                                }}
                            />
                        }
                    />
                    <ListSectionItem
                        title="음성 안내"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    userInfo?.voiceGuidanceEnabled ??
                                    false
                                }
                                onValueChange={handleSpeechChange}
                            />
                        }
                    />
                    {/* <ListSectionItem
                        title="진동 안내"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    userInfo?.voiceGuidanceEnabled ??
                                    false
                                }
                                onValueChange={handleSpeechChange}
                            />
                        }
                    /> */}
                    <ListSectionItem
                        title="케이던스 보조"
                        onHintPress={() => {
                            setCadenceAssistGuideShow(true);
                        }}
                        rightElement={
                            <StyledSwitch
                                isSelected={isCadenceAssistEnabled}
                                onValueChange={(v) => {
                                    handleCadenceAssistChange(v);
                                }}
                            />
                        }
                    />
                    <CadenceAssistControl isEnabled={isCadenceAssistEnabled} />
                </ListSectionContainer>

                {/* 법적 정보 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="법적 정보 및 기타"
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                        onPress={() => {
                            router.push("/(tabs)/profile/settings/legal");
                        }}
                    />
                </ListSectionContainer>

                {/* 건강 권한 */}
                <ListSectionContainer>
                    <ListSectionItem
                        title="애플 건강 연동"
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                        onPress={() => {
                            router.push("/(tabs)/profile/settings/health");
                        }}
                    />
                </ListSectionContainer>

                <ListSectionContainer>
                    <ListSectionItem
                        title="버전 정보"
                        rightElement={
                            <Typography variant="body2" color="primary">
                                {`${Application.nativeApplicationVersion}`}
                            </Typography>
                        }
                    />
                    <ListSectionItem
                        title="문의하기"
                        onPress={() => {
                            Linking.openURL(
                                "https://forms.gle/YhnuYBBqBD8beV4L6"
                            );
                        }}
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
                    />
                    <ListSectionItem
                        title="로그아웃"
                        titleColor="red"
                        onPress={() => {
                            setModalType("logout");
                            modalRef.current?.present();
                        }}
                        rightElement={<ChevronIcon color={colors.gray[40]} />}
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
