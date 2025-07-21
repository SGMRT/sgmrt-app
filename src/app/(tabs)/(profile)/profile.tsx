import { AlertIcon, ChevronIcon } from "@/assets/svgs/svgs";
import { invalidateToken } from "@/src/apis";
import BottomModal from "@/src/components/ui/BottomModal";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { StyledButton } from "@/src/components/ui/StyledButton";
import TabBar from "@/src/components/ui/TabBar";
import { Typography, TypographyColor } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import colors from "@/src/theme/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { Switch } from "react-native-gesture-handler";

export default function ProfileScreen() {
    const [selectedTab, setSelectedTab] = useState<"info" | "course">("info");
    const [modalType, setModalType] = useState<"logout" | "withdraw">("logout");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { logout } = useAuthStore();

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: "#111111",
                }}
            >
                {/* Header */}
                <View>
                    <Header titleText="마이페이지" hasBackButton={false} />
                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                        <HeaderTabItem
                            title="내 정보"
                            onPress={() => setSelectedTab("info")}
                            isSelected={selectedTab === "info"}
                        />
                        <HeaderTabItem
                            title="내 코스"
                            onPress={() => setSelectedTab("course")}
                            isSelected={selectedTab === "course"}
                        />
                    </View>
                </View>
                {/* Content */}
                {selectedTab === "info" && (
                    <Info
                        setModalType={setModalType}
                        modalRef={bottomSheetRef}
                    />
                )}
                {selectedTab === "course" && <Course />}
            </SafeAreaView>
            <TabBar />
            <BottomModal
                bottomSheetRef={bottomSheetRef}
                canClose={true}
                handleStyle={{
                    paddingTop: 10,
                    paddingBottom: 30,
                }}
            >
                <View style={{ gap: 30 }}>
                    <View style={{ gap: 15, alignItems: "center" }}>
                        <AlertIcon />
                        <View style={{ gap: 4, alignItems: "center" }}>
                            <Typography variant="headline" color="white">
                                {modalType === "logout"
                                    ? "로그아웃 하시겠습니까?"
                                    : "회원 탈퇴하시겠습니까?"}
                            </Typography>
                            <Typography variant="body2" color="gray40">
                                {modalType === "logout"
                                    ? "간편 로그인을 통해 다시 로그인할 수 있습니다"
                                    : "활동 내역 및 저장된 정보는 삭제되며 복구할 수 없습니다"}
                            </Typography>
                        </View>
                    </View>
                    <SlideToAction
                        label={
                            modalType === "logout"
                                ? "밀어서 로그아웃"
                                : "밀어서 회원 탈퇴"
                        }
                        onSlideSuccess={async () => {
                            bottomSheetRef.current?.close();
                            if (modalType === "logout") {
                                await invalidateToken();
                                logout();
                            } else {
                                console.log("회원 탈퇴");
                            }
                        }}
                        color="red"
                        direction="left"
                    />
                </View>
            </BottomModal>
        </View>
    );
}

const Info = ({
    setModalType,
    modalRef,
}: {
    setModalType: (type: "logout" | "withdraw") => void;
    modalRef: React.RefObject<BottomSheetModal | null>;
}) => {
    const router = useRouter();
    return (
        <ScrollView
            contentContainerStyle={{
                marginHorizontal: 17,
                marginTop: 20,
                gap: 20,
            }}
        >
            {/* Profile */}
            <View style={{ gap: 15, marginTop: 10 }}>
                <Profile />
                <View style={{ flexDirection: "row", gap: 4 }}>
                    <StyledButton
                        title="프로필 이미지 변경"
                        onPress={() => {}}
                        style={{ width: "50%" }}
                    />
                    <StyledButton
                        title="회원 정보 변경"
                        onPress={() => {
                            router.push("/(tabs)/(profile)/editInfo");
                        }}
                        style={{ width: "50%" }}
                    />
                </View>
            </View>
            {/* 디바이스 옵션 */}
            <ProfileOptionSection>
                <ProfileOptionItem
                    title="알림"
                    rightElement={
                        <StyledSwitch
                            isSelected={true}
                            onValueChange={() => {
                                console.log("onValueChange");
                            }}
                        />
                    }
                />
                <ProfileOptionItem
                    title="진동"
                    rightElement={
                        <StyledSwitch
                            isSelected={true}
                            onValueChange={() => {}}
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
                    title="약관 및 개인정보 처리 동의"
                    onPress={() => {}}
                    rightElement={<ChevronIcon color={colors.gray[40]} />}
                />
                <ProfileOptionItem
                    title="개인정보 처리방침"
                    onPress={() => {}}
                    rightElement={<ChevronIcon color={colors.gray[40]} />}
                />
            </ProfileOptionSection>
            {/* 법적 정보 */}
            <ProfileOptionSection>
                <ProfileOptionItem
                    title="버전 정보"
                    rightElement={
                        <Typography variant="body1" color="primary">
                            {`${Application.nativeApplicationVersion}`}
                        </Typography>
                    }
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
                <ProfileOptionItem
                    title="탈퇴하기"
                    onPress={() => {
                        setModalType("withdraw");
                        modalRef.current?.present();
                    }}
                    rightElement={<ChevronIcon color={colors.gray[60]} />}
                />
            </ProfileOptionSection>
        </ScrollView>
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

const StyledSwitch = ({
    isSelected,
    onValueChange,
}: {
    isSelected: boolean;
    onValueChange: (value: boolean) => void;
}) => {
    return (
        <Switch
            trackColor={{
                false: colors.gray[40],
                true: colors.primary,
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray[40]}
            style={{
                transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
            }}
            value={isSelected}
            onValueChange={onValueChange}
        />
    );
};

const Profile = () => {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: 15,
                alignItems: "center",
            }}
        >
            <Image
                source={{
                    uri: "https://picsum.photos/200/300",
                }}
                style={{ width: 60, height: 60, borderRadius: 100 }}
            />
            <View>
                <Typography variant="headline" color="gray20">
                    윤다희
                </Typography>
                <View
                    style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <Typography variant="body1" color="gray40">
                        166cm
                    </Typography>
                    <Divider />
                    <Typography variant="body1" color="gray40">
                        55kg
                    </Typography>
                    <Divider />
                    <Typography variant="body1" color="gray40">
                        여성
                    </Typography>
                </View>
            </View>
        </View>
    );
};

const Course = () => {
    return <View></View>;
};

const HeaderTabItem = ({
    title,
    onPress,
    isSelected,
}: {
    title: string;
    onPress: () => void;
    isSelected: boolean;
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                alignItems: "center",
                borderBottomColor: isSelected ? "#3f3f3f" : "transparent",
                borderBottomWidth: 1,
                paddingBottom: 10,
            }}
        >
            <Typography
                variant="subhead2"
                color={isSelected ? "white" : "gray80"}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};
