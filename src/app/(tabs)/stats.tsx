import { deleteRun, getRuns } from "@/src/apis";
import { RunResponse } from "@/src/apis/types/run";
import { HistoryWithFilter } from "@/src/components/course/HistoryWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { TabItem } from "@/src/components/ui/TabItem";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, View } from "react-native";
import Toast from "react-native-toast-message";

export default function Stats() {
    const [selectedTab, setSelectedTab] = useState<"SOLO" | "GHOST">("SOLO");
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedDeleteItems, setSelectedDeleteItems] = useState<
        RunResponse[]
    >([]);
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState<RunResponse | null>(
        null
    );
    const [selectedGhost, setSelectedGhost] = useState<RunResponse | null>(
        null
    );

    const handleCourseSelect = (course: RunResponse) => {
        if (selectedTab === "SOLO") {
            setSelectedCourse(course);
        } else {
            setSelectedGhost(course);
        }
    };

    const handleHistoryClickWithDelete = (history: RunResponse) => {
        if (isDeleteMode) {
            setSelectedDeleteItems((prev) => {
                if (prev.includes(history)) {
                    return prev.filter(
                        (item) => item.runningId !== history.runningId
                    );
                }
                return [...prev, history];
            });
        } else {
            handleCourseSelect(history);
        }
    };

    const onDeleteModeChange = () => {
        if (isDeleteMode) {
            Toast.show({
                type: "info",
                text1: "기록 삭제 모드를 종료합니다.",
                position: "bottom",
            });
            setIsDeleteMode(false);
        } else {
            Toast.show({
                type: "success",
                text1: "기록 삭제 모드를 활성화합니다",
                position: "bottom",
            });
            setIsDeleteMode(true);
            setSelectedDeleteItems([]);
        }
    };

    const onDeleteItems = () => {
        if (selectedDeleteItems.length === 0) {
            Toast.show({
                type: "info",
                text1: "삭제할 기록을 선택해주세요.",
                position: "bottom",
            });
            return;
        } else {
            Promise.all(
                selectedDeleteItems.map((item) => deleteRun(item.runningId))
            ).then(() => {
                Toast.show({
                    type: "success",
                    text1: "선택한 기록이 삭제되었습니다.",
                    position: "bottom",
                });
                setSelectedDeleteItems([]);
                setIsDeleteMode(false);
                setShouldRefresh(!shouldRefresh);
            });
        }
    };

    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <Header
                titleText="내 기록"
                onDelete={onDeleteModeChange}
                deleteColor={isDeleteMode ? colors.primary : colors.gray[40]}
                hasBackButton={false}
            />
            <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TabItem
                    title="개인 러닝"
                    onPress={() => setSelectedTab("SOLO")}
                    isSelected={selectedTab === "SOLO"}
                />
                <TabItem
                    title="고스트 러닝"
                    onPress={() => setSelectedTab("GHOST")}
                    isSelected={selectedTab === "GHOST"}
                />
            </View>
            <View style={{ flex: 1, marginTop: 20 }}>
                <UserHistory
                    mode={selectedTab}
                    isDeleteMode={isDeleteMode}
                    selectedItem={
                        selectedTab === "SOLO" ? selectedCourse : selectedGhost
                    }
                    selectedDeleteItem={selectedDeleteItems}
                    onClickItem={handleHistoryClickWithDelete}
                    shouldRefresh={shouldRefresh}
                />
            </View>
            <TabBar />
            <SlideToAction
                label={
                    isDeleteMode
                        ? "선택한 기록들 삭제 하기"
                        : (selectedTab === "SOLO" && selectedCourse) ||
                          (selectedTab === "GHOST" && selectedGhost)
                        ? "이 코스로 러닝 시작"
                        : "밀어서 러닝 시작"
                }
                onSlideSuccess={() => {
                    if (isDeleteMode) {
                        onDeleteItems();
                        return;
                    }

                    if (
                        selectedTab === "SOLO" &&
                        selectedCourse?.courseInfo?.id
                    ) {
                        router.push(
                            `/run/${selectedCourse!.courseInfo!.id}/-1`
                        );
                    } else if (
                        selectedTab === "GHOST" &&
                        selectedGhost?.courseInfo?.id
                    ) {
                        router.push(`/run/${selectedGhost!.courseInfo!.id}/-1`);
                    } else {
                        router.push("/run/solo");
                    }
                }}
                color="green"
                direction="left"
            />
        </SafeAreaView>
    );
}

const UserHistory = ({
    mode,
    isDeleteMode,
    selectedItem,
    selectedDeleteItem,
    onClickItem,
    shouldRefresh,
}: {
    mode: "SOLO" | "GHOST";
    isDeleteMode: boolean;
    selectedItem: RunResponse | null;
    selectedDeleteItem: RunResponse[];
    onClickItem: (history: RunResponse) => void;
    shouldRefresh: boolean;
}) => {
    // 검색 기간과 필터 타입을 상위에서 관리하여 서버 요청에 반영
    const [searchPeriod, setSearchPeriod] = useState<{
        startDate: Date;
        endDate: Date;
    }>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        endDate: new Date(),
    });

    const [selectedFilter, setSelectedFilter] = useState<"date" | "course">(
        "date"
    );

    const startEpoch = searchPeriod.startDate.getTime();
    const endEpoch = searchPeriod.endDate.getTime();
    const filteredBy: "DATE" | "COURSE" =
        selectedFilter === "date" ? "DATE" : "COURSE";

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useGetRuns(startEpoch, endEpoch, filteredBy, mode, shouldRefresh);

    if (isLoading) {
        return <></>;
    }

    if (isError) {
        return <Typography>에러가 발생했습니다.</Typography>;
    }

    const flatPages: RunResponse[] = data ?? [];

    return (
        <HistoryWithFilter
            mode={mode}
            data={flatPages}
            isDeleteMode={isDeleteMode}
            selectedItem={selectedItem}
            selectedDeleteItem={selectedDeleteItem}
            onClickItem={onClickItem}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            searchPeriod={searchPeriod}
            setSearchPeriod={setSearchPeriod}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
        />
    );
};

type RunsPageParam = {
    cursorRunningId: number | null;
    cursorStartedAt: number | null;
    cursorCourseName: string | null;
};

function useGetRuns(
    startEpoch: number,
    endEpoch: number,
    filteredBy: "DATE" | "COURSE",
    runningMode: "SOLO" | "GHOST",
    shouldRefresh: boolean
) {
    return useInfiniteQuery<
        RunResponse[],
        Error,
        RunResponse[],
        (string | number | boolean)[],
        RunsPageParam
    >({
        queryKey: [
            "runs",
            startEpoch,
            endEpoch,
            filteredBy,
            runningMode,
            shouldRefresh,
        ],
        queryFn: async ({ pageParam }) => {
            const request = {
                filteredBy,
                runningMode,
                startEpoch,
                endEpoch,
                ...pageParam,
            };
            return await getRuns(request);
        },
        select: (data) =>
            data.pages
                .flat()
                .filter(
                    (item, index, self) =>
                        index ===
                        self.findIndex((t) => t.runningId === item.runningId)
                ),
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.length) return undefined;
            const lastItem = lastPage[lastPage.length - 1];

            // 직전 페이지의 마지막 아이템과 동일하면 더 이상 다음 페이지 없음 처리
            const prevPage = allPages?.[allPages.length - 2] as
                | RunResponse[]
                | undefined;
            const prevLastItem = prevPage?.[prevPage.length - 1];
            if (prevLastItem && prevLastItem.runningId === lastItem.runningId) {
                return undefined;
            }

            return {
                cursorRunningId: lastItem.runningId,
                cursorStartedAt: lastItem.startedAt,
                cursorCourseName:
                    filteredBy === "COURSE"
                        ? lastItem.courseInfo?.name ?? null
                        : null,
            };
        },
        initialPageParam: {
            cursorRunningId: null,
            cursorStartedAt: null,
            cursorCourseName: null,
        },
    });
}
