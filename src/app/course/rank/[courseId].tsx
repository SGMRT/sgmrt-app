import { getCourseGhosts } from "@/src/apis";
import { GhostSortOption, HistoryResponse } from "@/src/apis/types/course";
import UserStatItem from "@/src/components/map/courseInfo/UserStatItem";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PERCENTILE_STOPS = [30, 45, 60, 75, 90, 100] as const;

type Row =
    | { kind: "header"; key: string; label: string }
    | {
          kind: "item";
          key: string;
          globalRank: number;
          label: string;
          item: HistoryResponse;
      };

function rankToPercentileBucket(
    globalRank: number,
    totalCount: number,
    stops = PERCENTILE_STOPS
) {
    const percentile = (globalRank / totalCount) * 100;
    for (const stop of stops) {
        if (percentile <= stop) return stop;
    }
    return stops[stops.length - 1];
}

function buildRows(
    flat: HistoryResponse[],
    totalCount: number,
    pageSize: number,
    firstPage: number
): Row[] {
    const rows: Row[] = [];
    let lastHeaderKey: string | null = null;

    flat.forEach((item, i) => {
        const globalRank = i + 1;

        if (globalRank <= 50) {
            if (lastHeaderKey !== "top50") {
                rows.push({ kind: "header", key: "top50", label: "상위 50등" });
                lastHeaderKey = "top50";
            }
            rows.push({
                kind: "item",
                key: `rank-${item.runningId}`,
                globalRank,
                label: "top",
                item,
            });
        } else {
            const bucket = rankToPercentileBucket(globalRank, totalCount);
            const headerKey = `pct-${bucket}`;
            if (lastHeaderKey !== headerKey) {
                rows.push({
                    kind: "header",
                    key: headerKey,
                    label: `상위 ${bucket}%`,
                });
                lastHeaderKey = headerKey;
            }
            rows.push({
                kind: "item",
                key: `rank-${item.runningId}`,
                globalRank,
                label: bucket.toString(),
                item,
            });
        }
    });

    return rows;
}

export default function CourseRankScreen() {
    const { courseId } = useLocalSearchParams();
    const [selectedGhostId, setSelectedGhostId] = useState<number | null>(null);
    const size = 30;
    const sort: GhostSortOption = "runningRecord.duration,asc";

    const [totalCount, setTotalCount] = useState<number>(0);

    const { uuid } = useAuthStore();

    const router = useRouter();

    const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useInfiniteQuery({
            queryKey: ["courseGhosts", courseId, sort, size],
            initialPageParam: 1,
            queryFn: async ({ pageParam }) => {
                if (!courseId) return null as any;
                const res = await getCourseGhosts({
                    courseId: Number(courseId),
                    pageable: { page: pageParam as number, size, sort },
                });
                return res;
            },
            getNextPageParam: (lastPage) => {
                if (!lastPage) return undefined;
                const current = lastPage.page.number;
                const totalPages = lastPage.page.totalPages;
                // 다음 페이지가 있으면 현재 페이지 + 1 반환 (1-based 가정)
                return current < totalPages ? current + 1 : undefined;
            },
            enabled: !!courseId,
        });

    // 플랫 리스트 및 총원 계산
    const flatGhosts = useMemo(() => {
        const pages = data?.pages?.filter(Boolean) ?? [];
        const contents = pages.flatMap((p) => p.content ?? []);
        const map = new Map<number, HistoryResponse>();
        contents.forEach((item) => {
            if (!map.has(item.runningId)) {
                map.set(item.runningId, item);
            }
        });
        return Array.from(map.values());
    }, [data]);

    useEffect(() => {
        // 선택된 고스트 초기화
        if (selectedGhostId === null && flatGhosts.length > 0) {
            setSelectedGhostId(flatGhosts[0].runningId);
        }
        const total = data?.pages?.[0]?.page?.totalElements ?? 0;
        setTotalCount(total);
    }, [flatGhosts, data, selectedGhostId]);

    const rows = useMemo(() => {
        if (!totalCount) return [];
        return buildRows([...flatGhosts], totalCount, size, 1);
    }, [flatGhosts, totalCount, size]);

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="소고기마라탕" />
            <View style={{ flex: 1, marginHorizontal: 16.5, marginTop: 10 }}>
                <FlashList
                    data={rows}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                        <>
                            {item.kind === "header" && (
                                <View
                                    style={[
                                        {
                                            backgroundColor: "#171717",
                                            padding: 20,
                                            borderTopLeftRadius: 20,
                                            borderTopRightRadius: 20,
                                            gap: 10,
                                        },
                                        item.label !== "상위 50등" && {
                                            marginTop: 20,
                                        },
                                    ]}
                                >
                                    <Typography
                                        variant="headline"
                                        color="white"
                                    >
                                        {item.label}
                                    </Typography>
                                    <Divider direction="horizontal" />
                                </View>
                            )}
                            {item.kind === "item" && (
                                <View
                                    style={[
                                        {
                                            backgroundColor: "#171717",
                                            paddingBottom: 20,
                                        },
                                        rows
                                            .filter(
                                                (row) =>
                                                    row.label === item.label
                                            )
                                            .at(-1)?.key === item.key
                                            ? {
                                                  borderBottomLeftRadius: 20,
                                                  borderBottomRightRadius: 20,
                                              }
                                            : {},
                                    ]}
                                >
                                    <UserStatItem
                                        key={item.key}
                                        rank={
                                            item.globalRank <= 50
                                                ? item.globalRank
                                                : "-"
                                        }
                                        name={item.item.runningName}
                                        avatar={item.item.runnerProfileUrl}
                                        time={getRunTime(
                                            item.item.duration,
                                            "MM:SS"
                                        )}
                                        pace={getFormattedPace(
                                            item.item.averagePace
                                        )}
                                        cadence={
                                            item.item.cadence.toString() +
                                            " spm"
                                        }
                                        ghostId={item.item.runningId.toString()}
                                        isGhostSelected={
                                            selectedGhostId ===
                                            item.item.runningId
                                        }
                                        onPress={() =>
                                            setSelectedGhostId(
                                                item.item.runningId
                                            )
                                        }
                                        isMyRecord={
                                            item.item.runnerUuid === uuid
                                        }
                                        paddingVertical={false}
                                    />
                                </View>
                            )}
                        </>
                    )}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    extraData={selectedGhostId}
                />
            </View>

            <SlideToAction
                label="고스트와 러닝 시작"
                onSlideSuccess={() => {
                    router.push(`/run/${courseId}/${selectedGhostId}`);
                }}
                color="green"
                direction="left"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        marginBottom: 20,
    },
    headerText: {
        marginBottom: 10,
    },
});
