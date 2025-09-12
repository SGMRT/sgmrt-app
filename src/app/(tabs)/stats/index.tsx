import { getRuns } from "@/src/apis";
import { RunResponse } from "@/src/apis/types/run";
import { HistoryWithFilter } from "@/src/components/course/HistoryWithFilter";
import Header from "@/src/components/ui/Header";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, View } from "react-native";

export default function Stats() {
    const router = useRouter();
    const handleRecordClick = (record: RunResponse) => {
        router.push(
            `/stats/result/${record.runningId}/${record.courseInfo?.id ?? -1}/${
                record.ghostRunningId ?? -1
            }`
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <Header titleText="내 기록" hasBackButton={false} />
            <View style={{ flex: 1, marginTop: 20 }}>
                <UserHistory
                    onClickItem={handleRecordClick}
                    shouldRefresh={false}
                />
            </View>
            <TabBar />
        </SafeAreaView>
    );
}

const UserHistory = ({
    onClickItem,
    shouldRefresh,
}: {
    onClickItem: (history: RunResponse) => void;
    shouldRefresh: boolean;
}) => {
    // 검색 기간과 필터 타입을 상위에서 관리하여 서버 요청에 반영
    const [searchPeriod, setSearchPeriod] = useState<{
        startDate: Date;
        endDate: Date;
    }>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
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
    } = useGetRuns(startEpoch, endEpoch, filteredBy, "SOLO", shouldRefresh);

    if (isLoading) {
        return <></>;
    }

    if (isError) {
        return <Typography>에러가 발생했습니다.</Typography>;
    }

    const flatPages: RunResponse[] = data ?? [];

    return (
        <HistoryWithFilter
            data={flatPages}
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
