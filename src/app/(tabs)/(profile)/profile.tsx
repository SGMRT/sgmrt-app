import { AlertIcon } from "@/assets/svgs/svgs";
import { invalidateToken } from "@/src/apis";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import { Info } from "@/src/components/profile/Info";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
    const [selectedTab, setSelectedTab] = useState<"info" | "course">("info");
    const [modalType, setModalType] = useState<"logout" | "withdraw">("logout");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const router = useRouter();
    const { logout } = useAuthStore();
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(1);
    const data = [
        {
            id: 1,
            name: "소고기마라탕",
        },
        {
            id: 2,
            name: "소고기마라탕",
        },
        {
            id: 3,
            name: "소고기마라탕",
        },
    ];
    const selectedCourseName = data.find(
        (course) => course.id === selectedCourseId
    )?.name;
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
                    <Header
                        titleText="마이페이지"
                        // hasBackButton={false}
                        onDelete={
                            selectedTab === "course" && selectedCourseId
                                ? () => {
                                      setSelectedCourseId(null);
                                  }
                                : undefined
                        }
                    />
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
                {selectedTab === "course" && (
                    <Course
                        data={data}
                        selectedCourseId={selectedCourseId}
                        setSelectedCourseId={setSelectedCourseId}
                    />
                )}
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
                                Toast.show({
                                    type: "success",
                                    text1: "로그아웃 되었습니다.",
                                    position: "bottom",
                                });
                            } else {
                                console.log("회원 탈퇴");
                            }
                        }}
                        color="red"
                        direction="left"
                    />
                </View>
            </BottomModal>
            {selectedTab === "course" && selectedCourseId && (
                <SlideToAction
                    label="이 코스로 러닝 시작"
                    onSlideSuccess={() => {
                        router.push(
                            `/run/${selectedCourseId}/${selectedCourseName}/-1`
                        );
                    }}
                    color="green"
                    direction="left"
                />
            )}
        </View>
    );
}

const Course = ({
    data,
    selectedCourseId,
    setSelectedCourseId,
}: {
    data: any[];
    selectedCourseId: number | null;
    setSelectedCourseId: (id: number | null) => void;
}) => {
    return (
        <View style={{ marginTop: 20, flex: 1 }}>
            <CoursesWithFilter
                data={data}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
            />
        </View>
    );
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
