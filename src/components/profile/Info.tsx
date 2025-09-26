import { DefaultProfileIcon } from "@/assets/icons/icons";
import { ChevronIcon } from "@/assets/svgs/svgs";
import {
    getPresignedUrl,
    getUserInfo,
    patchUserInfo,
    patchUserSettings,
    uploadToS3,
} from "@/src/apis";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import { useLocalNotificationPermission } from "@/src/features/notifications/useLocalNotificationPermission";
import { useAuthStore, UserInfo, UserSettings } from "@/src/store/authState";
import { useLocalPrefs } from "@/src/store/localPrefs";
import colors from "@/src/theme/colors";
import { pickImage } from "@/src/utils/pickImage";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
    AuthorizationStatus,
    authorizationStatusFor,
} from "@kingstinct/react-native-healthkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    AppState,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileNoticeSection } from "../notice/ui/ProfileNoticeSection";
import { Divider } from "../ui/Divider";
import { StyledButton } from "../ui/StyledButton";
import { StyledSwitch } from "../ui/StyledSwitch";
import { Typography, TypographyColor } from "../ui/Typography";
import { showToast } from "../ui/toastConfig";

const HK = {
    writeWorkout: "HKWorkoutTypeIdentifier",
    writeWR: "HKQuantityTypeIdentifierDistanceWalkingRunning",
    writeRoute: "HKWorkoutRouteTypeIdentifier",
    writeEnergy: "HKQuantityTypeIdentifierActiveEnergyBurned",
    readHeartRate: "HKQuantityTypeIdentifierHeartRate",
} as const;

function applyUserInfoToStore(
    res: GetUserInfoResponse,
    setUserInfoStore: (userInfo: UserInfo) => void,
    setUserSettingsStore: (userSettings: UserSettings) => void
) {
    setUserInfoStore({
        username: res.nickname,
        gender: res.gender,
        age: res.age,
        height: res.height,
        weight: res.weight,
    });
    setUserSettingsStore({
        pushAlarmEnabled: res.pushAlarmEnabled,
        vibrationEnabled: res.vibrationEnabled,
        voiceGuidanceEnabled: res.voiceGuidanceEnabled,
    });
}

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
    const [healthKitAuth, setHealthKitAuth] = useState<{
        writeWRAuth: AuthorizationStatus;
        writeWorkoutAuth: AuthorizationStatus;
        writeRouteAuth: AuthorizationStatus;
        writeEnergyAuth: AuthorizationStatus;
        readHeartRateAuth: AuthorizationStatus;
    }>({
        writeWRAuth: AuthorizationStatus.notDetermined,
        writeWorkoutAuth: AuthorizationStatus.notDetermined,
        writeRouteAuth: AuthorizationStatus.notDetermined,
        writeEnergyAuth: AuthorizationStatus.notDetermined,
        readHeartRateAuth: AuthorizationStatus.notDetermined,
    });

    const updateHealthKitAuth = useCallback(() => {
        const writeWRAuth = authorizationStatusFor(HK.writeWR);
        const writeWorkoutAuth = authorizationStatusFor(HK.writeWorkout);
        const writeRouteAuth = authorizationStatusFor(HK.writeRoute);
        const writeEnergyAuth = authorizationStatusFor(HK.writeEnergy);
        const readHeartRateAuth = authorizationStatusFor(HK.readHeartRate);
        setHealthKitAuth({
            writeWRAuth,
            writeWorkoutAuth,
            writeRouteAuth,
            writeEnergyAuth,
            readHeartRateAuth,
        });
    }, []);

    useEffect(() => {
        // event listener
        const sub = AppState.addEventListener("change", async (next) => {
            if (next === "active") {
                updateHealthKitAuth();
            }
        });
        return () => sub.remove();
    }, [updateHealthKitAuth]);

    const {
        setUserInfo: setUserInfoStore,
        setUserSettings: setUserSettings,
        userSettings: userSettingsStore,
    } = useAuthStore();
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
        queryKey: ["user", "info"],
        queryFn: async () => {
            try {
                const res = await getUserInfo();
                applyUserInfoToStore(res, setUserInfoStore, setUserSettings);
                return res;
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
            updateHealthKitAuth();
        }, [refresh, updateHealthKitAuth])
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
            setUserSettings({
                ...userSettingsStore!,
                ...payload,
            });
            await queryClient.cancelQueries({ queryKey: ["user", "info"] });
            const prev = queryClient.getQueryData<GetUserInfoResponse>([
                "user",
                "info",
            ]);
            if (prev) {
                const next = { ...prev, ...payload };
                queryClient.setQueryData<GetUserInfoResponse>(
                    ["user", "info"],
                    next
                );
                // Zustand 동기화
                applyUserInfoToStore(next, setUserInfoStore, setUserSettings);
            }
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) {
                queryClient.setQueryData<GetUserInfoResponse>(
                    ["user", "info"],
                    ctx.prev
                );
                applyUserInfoToStore(
                    ctx.prev,
                    setUserInfoStore,
                    setUserSettings
                );
            }
            showToast(
                "info",
                "서버 동기화에 실패했어요. 다시 시도해주세요.",
                bottom
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["user", "info"] });
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

    const handleHealthKitChange = () => {
        Alert.alert(
            "애플 건강 연동",
            "건강 앱을 선택하여 건강 권한을 설정해주세요.",
            [
                { text: "취소", style: "destructive" },
                { text: "설정 열기", onPress: () => Linking.openSettings() },
            ]
        );
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
                ["user", "info"],
                (prev) => {
                    if (!prev) return prev as any;
                    const next = { ...prev, profilePictureUrl: finalUrl };
                    applyUserInfoToStore(
                        next,
                        setUserInfoStore,
                        setUserSettings
                    );
                    return next;
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
            queryClient.invalidateQueries({ queryKey: ["user", "info"] });
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
                <Profile userInfo={userInfo ?? null} loading={isFetching} />
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
            <ProfileOptionSection>
                <ProfileOptionItem
                    title="알림"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                (userSettingsStore?.pushAlarmEnabled &&
                                    granted) ??
                                false
                            }
                            onValueChange={(value) => {
                                handlePushAlarmChange(value);
                            }}
                        />
                    }
                />
                {/* <ProfileOptionItem
                    title="진동"
                    rightElement={
                        <StyledSwitch
                            isSelected={userInfo?.vibrationEnabled ?? false}
                            onValueChange={handleVibrationChange}
                        />
                    }
                /> */}
                <ProfileOptionItem
                    title="음성 안내"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                userSettingsStore?.voiceGuidanceEnabled ?? false
                            }
                            onValueChange={handleSpeechChange}
                        />
                    }
                />
                <ProfileOptionItem
                    title="케이던스 보조"
                    rightElement={
                        <StyledSwitch
                            isSelected={isCadenceAssistEnabled}
                            onValueChange={(v) => {
                                handleCadenceAssistChange(v);
                            }}
                        />
                    }
                />
                {isCadenceAssistEnabled && (
                    <CadenceAssistControl
                        initialValue={useLocalPrefs.getState().cadenceTarget}
                    />
                )}
            </ProfileOptionSection>
            {/* 건강 권한 */}
            <ProfileOptionSection>
                <ProfileOptionItem title="애플 건강 연동" />
                <ProfileOptionItem
                    title="쓰기: 운동"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                healthKitAuth.writeWorkoutAuth ===
                                AuthorizationStatus.sharingAuthorized
                            }
                            onValueChange={handleHealthKitChange}
                        />
                    }
                />
                <ProfileOptionItem
                    title="쓰기: 걷기 + 달리기"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                healthKitAuth.writeWRAuth ===
                                AuthorizationStatus.sharingAuthorized
                            }
                            onValueChange={handleHealthKitChange}
                        />
                    }
                />
                <ProfileOptionItem
                    title="쓰기: 운동 경로"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                healthKitAuth.writeRouteAuth ===
                                AuthorizationStatus.sharingAuthorized
                            }
                            onValueChange={handleHealthKitChange}
                        />
                    }
                />
                <ProfileOptionItem
                    title="쓰기: 활동 에너지"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                healthKitAuth.writeEnergyAuth ===
                                AuthorizationStatus.sharingAuthorized
                            }
                            onValueChange={handleHealthKitChange}
                        />
                    }
                />
                <ProfileOptionItem
                    title="읽기: 심박수"
                    rightElement={
                        <StyledSwitch
                            isSelected={
                                healthKitAuth.readHeartRateAuth ===
                                AuthorizationStatus.sharingAuthorized
                            }
                            onValueChange={handleHealthKitChange}
                        />
                    }
                />
            </ProfileOptionSection>
            {/* 법적 정보 */}
            <ProfileOptionSection>
                <ProfileOptionItem
                    title="법적 정보 및 기타"
                    borderBottom={true}
                />
                <ProfileOptionItem
                    title="서비스 이용약관"
                    onPress={() => {
                        router.push({
                            pathname: "/(tabs)/profile/termDetail",
                            params: {
                                key: "serviceTermsAgreed",
                            },
                        });
                    }}
                    rightElement={<ChevronIcon color={colors.gray[40]} />}
                />
                <ProfileOptionItem
                    title="개인정보 처리방침"
                    onPress={() => {
                        router.push({
                            pathname: "/(tabs)/profile/termDetail",
                            params: {
                                key: "privacyPolicyAgreed",
                            },
                        });
                    }}
                    rightElement={<ChevronIcon color={colors.gray[40]} />}
                />
                <ProfileOptionItem
                    title="개인정보 수집 및 이용 동의"
                    onPress={() => {
                        router.push({
                            pathname: "/(tabs)/profile/termDetail",
                            params: {
                                key: "personalInformationUsageConsentAgreed",
                            },
                        });
                    }}
                    rightElement={<ChevronIcon color={colors.gray[40]} />}
                />
            </ProfileOptionSection>
            {/* 법적 정보 */}
            <ProfileOptionSection>
                <ProfileOptionItem
                    title="버전 정보"
                    rightElement={
                        <Typography variant="body2" color="primary">
                            {`${Application.nativeApplicationVersion}`}
                        </Typography>
                    }
                />
                <ProfileOptionItem
                    title="의견 보내기"
                    onPress={() => {
                        Linking.openURL("https://forms.gle/YhnuYBBqBD8beV4L6");
                    }}
                    rightElement={<ChevronIcon color={colors.gray[60]} />}
                />
                <ProfileOptionItem
                    title="로그아웃"
                    titleColor="red"
                    onPress={() => {
                        setModalType("logout");
                        modalRef.current?.present();
                    }}
                    rightElement={<ChevronIcon color={colors.gray[60]} />}
                />
            </ProfileOptionSection>
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
    );
};

const CadenceAssistControl = ({ initialValue }: { initialValue: number }) => {
    const [value, setValue] = useState(initialValue);

    const handleDecCadenceTarget = () => {
        setValue(value - 10);
        useLocalPrefs.getState().decCadenceTarget(10);
    };

    const handleIncCadenceTarget = () => {
        setValue(value + 10);
        useLocalPrefs.getState().incCadenceTarget(10);
    };
    return (
        <View
            style={{
                paddingHorizontal: 17,
                paddingBottom: 14,
                gap: 12,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                {/* -10 버튼 */}
                <TouchableOpacity
                    onPress={() => handleDecCadenceTarget()}
                    onLongPress={() => handleDecCadenceTarget()}
                    style={{
                        height: 28,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: "#1F1F1F",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="subhead3" color="white">
                        -10
                    </Typography>
                </TouchableOpacity>

                {/* 현재 값 */}
                <View
                    style={{
                        flex: 1,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: "#111111",
                        borderWidth: 1,
                        borderColor: "#212121",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="subhead3" color="gray20">
                        {value} spm
                    </Typography>
                </View>

                {/* +10 버튼 */}
                <TouchableOpacity
                    onPress={() => handleIncCadenceTarget()}
                    onLongPress={() => handleIncCadenceTarget()}
                    style={{
                        height: 28,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: "#1F1F1F",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="subhead3" color="white">
                        +10
                    </Typography>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ProfileOptionSection = ({ children }: { children: React.ReactNode }) => {
    return (
        <View
            style={{
                backgroundColor: "#171717",
                borderRadius: 8,
            }}
        >
            {children}
        </View>
    );
};

interface ProfileOptionItemProps {
    title: string;
    titleColor?: TypographyColor;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    borderBottom?: boolean;
}

const ProfileOptionItem = ({
    title,
    titleColor = "white",
    onPress,
    rightElement,
    borderBottom = false,
}: ProfileOptionItemProps) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.5 : 1}>
            <View
                style={{
                    height: 62,
                    paddingHorizontal: 17,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: borderBottom ? 1 : 0,
                    borderBottomColor: "#212121",
                }}
            >
                <Typography variant="subhead2" color={titleColor}>
                    {title}
                </Typography>
                {rightElement}
            </View>
        </TouchableOpacity>
    );
};

const Profile = ({
    userInfo,
    loading,
}: {
    userInfo: GetUserInfoResponse | null;
    loading?: boolean;
}) => {
    const userProfileImageUrl =
        userInfo?.profilePictureUrl?.split("?X-Amz-")[0];

    return (
        <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <Image
                source={
                    userProfileImageUrl
                        ? { uri: userProfileImageUrl }
                        : DefaultProfileIcon
                }
                style={{ width: 60, height: 60, borderRadius: 100 }}
            />
            <View>
                <Typography variant="headline" color="gray20">
                    {loading ? "" : userInfo?.nickname ?? "고스트러너"}
                </Typography>
                <View
                    style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.height
                            ? `${userInfo.height}cm`
                            : "키 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.weight
                            ? `${userInfo.weight}kg`
                            : "몸무게 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.gender === "MALE"
                            ? "남성"
                            : userInfo?.gender === "FEMALE"
                            ? "여성"
                            : "성별 비공개"}
                    </Typography>
                </View>
            </View>
        </View>
    );
};
