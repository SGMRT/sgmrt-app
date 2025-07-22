import { AlertIcon } from "@/assets/svgs/svgs";
import { getUserCourses, invalidateToken } from "@/src/apis";
import { GhostSortOption, UserCourseInfo } from "@/src/apis/types/course";
import { CourseFilter } from "@/src/components/course/CourseFilter";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import { Info } from "@/src/components/profile/Info";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { TabItem } from "@/src/components/ui/TabItem";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView, View } from "react-native";
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
                        hasBackButton={false}
                        onDelete={
                            selectedTab === "course" && selectedCourse
                                ? () => {
                                      setSelectedCourse(null);
                                  }
                                : undefined
                        }
                    />
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
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedFilter, setSelectedFilter] = useState<
        "day" | "week" | "month" | "year"
    >("month");
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
                onClickFilter={() => bottomSheetRef.current?.present()}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
            />
            <CourseFilter
                bottomSheetRef={bottomSheetRef}
                setSelectedFilter={setSelectedFilter}
                selectedFilter={selectedFilter}
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
