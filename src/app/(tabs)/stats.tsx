import { getRuns } from "@/src/apis";
import { RunResponse } from "@/src/apis/types/run";
import { CourseFilter } from "@/src/components/course/CourseFilter";
import { HistoryWithFilter } from "@/src/components/course/HistoryWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { TabItem } from "@/src/components/ui/TabItem";
import { Typography } from "@/src/components/ui/Typography";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView, View } from "react-native";

export default function Stats() {
    const [selectedTab, setSelectedTab] = useState<"SOLO" | "GHOST">("SOLO");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedFilter, setSelectedFilter] = useState<
        "day" | "week" | "month" | "year"
    >("month");

    const [selectedCourse, setSelectedCourse] = useState<RunResponse | null>(
        null
    );
    const [selectedGhost, setSelectedGhost] = useState<RunResponse | null>(
        null
    );

    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <Header
                titleText="내 기록"
                onDelete={
                    selectedTab === "SOLO" && selectedCourse
                        ? () => setSelectedCourse(null)
                        : selectedTab === "GHOST" && selectedGhost
                        ? () => setSelectedGhost(null)
                        : undefined
                }
            />
            <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TabItem
                    title="내 기록"
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
                    selectedItem={selectedCourse}
                    setSelectedItem={setSelectedCourse}
                    bottomSheetRef={bottomSheetRef}
                />
            </View>
            <TabBar />
            {((selectedTab === "SOLO" && selectedCourse?.courseInfo.id) ||
                (selectedTab === "GHOST" && selectedGhost?.courseInfo.id)) && (
                <SlideToAction
                    label={"이 코스로 러닝 시작"}
                    onSlideSuccess={() => {
                        if (selectedTab === "SOLO") {
                            router.push(
                                `/run/${selectedCourse!.courseInfo.id}/-1`
                            );
                        } else {
                            router.push(
                                `/run/${selectedGhost!.courseInfo.id}/-1`
                            );
                        }
                    }}
                    color="green"
                    direction="left"
                />
            )}
            <CourseFilter
                bottomSheetRef={bottomSheetRef}
                setSelectedFilter={setSelectedFilter}
                selectedFilter={selectedFilter}
            />
        </SafeAreaView>
    );
}

const UserHistory = ({
    mode,
    selectedItem,
    setSelectedItem,
    bottomSheetRef,
}: {
    mode: "SOLO" | "GHOST";
    selectedItem: RunResponse | null;
    setSelectedItem: (item: RunResponse | null) => void;
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}) => {
    const { data, isLoading, isError, fetchNextPage, hasNextPage } =
        useGetRuns(mode);

    if (isLoading) {
        return <></>;
    }

    if (isError) {
        return <Typography>에러가 발생했습니다.</Typography>;
    }

    return (
        data && (
            <HistoryWithFilter
                data={data.pages.flat() as RunResponse[]}
                selectedCourse={selectedItem}
                setSelectedCourse={setSelectedItem}
                onClickFilter={() => {
                    bottomSheetRef.current?.present();
                }}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
            />
        )
    );
};

function useGetRuns(runningMode: "SOLO" | "GHOST") {
    return useInfiniteQuery({
        queryKey: ["runs", runningMode],
        queryFn: async ({ pageParam }) => {
            const request = {
                runningMode,
                ...pageParam,
            };
            return getRuns(request);
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.length) return undefined;
            const lastItem = lastPage[lastPage.length - 1];
            return {
                cursorStartedAt: lastItem.startedAt,
                cursorRunningId: lastItem.runningId,
            };
        },
        initialPageParam: {
            cursorStartedAt: null,
            cursorRunningId: null,
        },
    });
}
