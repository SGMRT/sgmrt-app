import { AlertIcon } from "@/assets/svgs/svgs";
import { deleteUser, getUserCourses, invalidateToken } from "@/src/apis";
import { GhostSortOption, UserCourseInfo } from "@/src/apis/types/course";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import { Info } from "@/src/components/profile/Info";
import { ActionButton } from "@/src/components/ui/ActionButton";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import ScrollButton from "@/src/components/ui/ScrollButton";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { TabItem } from "@/src/components/ui/TabItem";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import colors from "@/src/theme/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
    const { tab } = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState<"info" | "course">(
        tab === "course" ? "course" : "info"
    );
    const [modalType, setModalType] = useState<"logout" | "withdraw">("logout");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const router = useRouter();
    const { logout } = useAuthStore();
    const [selectedCourse, setSelectedCourse] = useState<UserCourseInfo | null>(
        null
    );
    const { bottom } = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    return (
        <View style={{ flex: 1, backgroundColor: "#111111" }}>
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: "#111111",
                    marginBottom: bottom + 70,
                }}
            >
                {/* Header */}
                <View>
                    <Header titleText="마이페이지" hasBackButton={false} />
                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                        <TabItem
                            title="내 정보"
                            onPress={() => setSelectedTab("info")}
                            isSelected={selectedTab === "info"}
                        />
                        <TabItem
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
                        scrollViewRef={scrollViewRef}
                    />
                )}
                {selectedTab === "course" && (
                    <Course
                        selectedCourse={selectedCourse}
                        setSelectedCourse={setSelectedCourse}
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
                        <AlertIcon color={colors.red} />
                        <View style={{ gap: 4, alignItems: "center" }}>
                            <Typography variant="headline" color="white">
                                {modalType === "logout"
                                    ? "로그아웃 하시겠습니까?"
                                    : "회원 탈퇴하시겠습니까?"}
                            </Typography>
                            <Typography variant="body3" color="gray40">
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
                                Toast.show({
                                    type: "success",
                                    text1: "로그아웃 되었습니다.",
                                    position: "bottom",
                                });
                                logout();
                            } else {
                                Alert.alert(
                                    "회원 탈퇴",
                                    "정말로 탈퇴하시겠습니까?",
                                    [
                                        {
                                            text: "취소",
                                            style: "cancel",
                                        },
                                        {
                                            text: "탈퇴",
                                            onPress: async () => {
                                                await deleteUser();
                                                logout();
                                            },
                                        },
                                    ]
                                );
                            }
                        }}
                        color="red"
                        direction="left"
                    />
                </View>
            </BottomModal>
            <ActionButton
                type="active"
                postion="bottom-left"
                onPress={() => {
                    router.push("/run/solo");
                }}
            />
            <ScrollButton
                onPress={() => {
                    scrollViewRef.current?.scrollTo({
                        y: 0,
                        animated: true,
                    });
                }}
            />
            {selectedTab === "course" && selectedCourse && (
                <SlideToAction
                    label="이 코스로 러닝 시작"
                    onSlideSuccess={() => {
                        router.push(`/run/${selectedCourse.id}/-1`);
                    }}
                    color="green"
                    direction="left"
                />
            )}
        </View>
    );
}

const Course = ({
    selectedCourse,
    setSelectedCourse,
}: {
    selectedCourse: UserCourseInfo | null;
    setSelectedCourse: (course: UserCourseInfo | null) => void;
}) => {
    const { data, isLoading, isError, fetchNextPage, hasNextPage } =
        useUserCourses();

    if (isLoading) {
        return <></>;
    }
    if (isError) {
        return <Typography>코스 정보를 불러오는데 실패했습니다.</Typography>;
    }
    return (
        <View style={{ marginTop: 20, flex: 1 }}>
            <CoursesWithFilter
                data={data?.pages.flatMap((page) => page.content) ?? []}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
            />
        </View>
    );
};

export function useUserCourses(
    size: number = 10,
    sort: GhostSortOption = "id,asc"
) {
    return useInfiniteQuery({
        queryKey: ["user-courses", size, sort],
        queryFn: async ({ pageParam = 0 }) =>
            getUserCourses({ page: pageParam, size, sort }),
        getNextPageParam: (lastPage) => {
            const { number, totalPages } = lastPage.page;
            return number + 1 < totalPages ? number + 1 : undefined;
        },
        initialPageParam: 0,
    });
}
