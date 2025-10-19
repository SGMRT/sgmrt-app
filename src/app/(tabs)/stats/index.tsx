import { getRuns, getRunsByCourse } from "@/src/apis";
import { RunResponse } from "@/src/apis/types/run";
import { HistoryWithFilter } from "@/src/components/course/HistoryWithFilter";
import Header from "@/src/components/ui/Header";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { endOfDay, startOfDay } from "@/src/utils/formatDate";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";

export default function Stats() {
    const { courseId, courseName } = useLocalSearchParams();

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
                    initialCourseId={courseId ? Number(courseId) : null}
                    initialCourseName={courseName ? String(courseName) : null}
                    onClickItem={handleRecordClick}
                    shouldRefresh={false}
                />
            </View>
            <TabBar />
        </SafeAreaView>
    );
}

const UserHistory = ({
    initialCourseId,
    initialCourseName,
    onClickItem,
    shouldRefresh,
}: {
    initialCourseId: number | null;
    initialCourseName: string | null;
    onClickItem: (history: RunResponse) => void;
    shouldRefresh: boolean;
}) => {
    const [showPrefaceCourse, setShowPrefaceCourse] = useState(
        !!initialCourseId
    );

    useEffect(() => {
        if (initialCourseId) {
            setShowPrefaceCourse(true);
            setSelectedFilter("course");
            setShowPrefaceCourse(true);
        }
    }, [initialCourseId]);

    const [searchPeriod, _setSearchPeriod] = useState<{
        startDate: Date;
        endDate: Date;
    }>({
        startDate: startOfDay(
            new Date(new Date().setDate(new Date().getDate() - 30))
        ),
        endDate: endOfDay(new Date()),
    });

    const [selectedFilter, _setSelectedFilter] = useState<"date" | "course">(
        initialCourseId ? "course" : "date"
    );

    const setSearchPeriod = (next: { startDate: Date; endDate: Date }) => {
        setShowPrefaceCourse(false);
        _setSearchPeriod(next);
    };
    const setSelectedFilter = (next: "date" | "course") => {
        setShowPrefaceCourse(false);
        _setSelectedFilter(next);
    };

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
    } = useGetRuns(startEpoch, endEpoch, filteredBy, shouldRefresh);

    const { data: courseData } = useQuery({
        queryKey: ["coursePreface", initialCourseId],
        queryFn: () => getRunsByCourse(initialCourseId ?? 0),
        select: (data) => {
            return data.map((r) => ({
                ...r,
                courseInfo: {
                    id: initialCourseId ?? 0,
                    name: initialCourseName ?? "",
                    isPublic: true,
                },
            }));
        },
        enabled: !!initialCourseId && showPrefaceCourse,
    });

    console.log("courseData", courseData?.length);
    console.log("showPrefaceCourse", showPrefaceCourse);

    if (isLoading) {
        return <></>;
    }

    if (isError) {
        return (
            <Typography
                color="white"
                variant="body2"
                style={{ alignSelf: "center", marginTop: 20 }}
            >
                에러가 발생했습니다.
            </Typography>
        );
    }

    const flatPages: RunResponse[] = data ?? [];

    const viewData: RunResponse[] =
        !showPrefaceCourse || !initialCourseId || !courseData?.length
            ? flatPages
            : [
                  ...(courseData ?? []),
                  ...flatPages.filter(
                      (r) => r.courseInfo?.id !== Number(initialCourseId)
                  ),
              ];
    return (
        <HistoryWithFilter
            data={viewData}
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
    shouldRefresh: boolean
) {
    return useInfiniteQuery<
        RunResponse[],
        Error,
        RunResponse[],
        (string | number | boolean)[],
        RunsPageParam
    >({
        queryKey: ["runs", startEpoch, endEpoch, filteredBy, shouldRefresh],
        queryFn: async ({ pageParam }) => {
            const request = {
                filteredBy,
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
