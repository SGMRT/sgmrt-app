import { getNoticesAll, Notice } from "@/src/apis";
import localEvent from "@/src/components/notice/localEvent.json";
import { NoticePreviewList } from "@/src/components/notice/NoticePreviewList";
import { NoticePageHeader } from "@/src/components/notice/ui/NoticePageHeader";
import { ScrollButton, TabBar } from "@/src/components/ui";
import { FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const PAGE_SIZE = 10;

export default function NoticePage() {
    const { tab = "general" } = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState<"GENERAL" | "EVENT">(
        tab === "event" ? "EVENT" : "GENERAL"
    );
    const listRef = useRef<FlashListRef<Notice>>(null);

    const handleTabPress = useCallback((tab: "GENERAL" | "EVENT") => {
        setSelectedTab(tab);
    }, []);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ["notices", selectedTab],
            initialPageParam: 0 as number,
            queryFn: ({ pageParam = 0 }) => getNoticesAll(pageParam, PAGE_SIZE),
            getNextPageParam: (lastPage) => {
                const { number, totalPages } = lastPage!.page;
                const next = number + 1;
                return next < totalPages ? next : undefined;
            },
            staleTime: 30_000,
        });

    const mergedData = useMemo<Notice[]>(() => {
        return [
            ...(data?.pages.flatMap((p) => p.content) ?? []),
            localEvent && new Date(localEvent.endAt).getTime() > Date.now()
                ? (localEvent as unknown as Notice)
                : (null as Notice | null),
        ]
            .filter((item) => item !== null)
            .sort(
                (a, b) =>
                    new Date(b.startAt).getTime() -
                    new Date(a.startAt).getTime()
            );
    }, [data]);

    const items = useMemo<Notice[]>(
        () =>
            mergedData.filter(
                (item) =>
                    item.type === selectedTab ||
                    item.type === `${selectedTab}_V2`
            ),
        [mergedData, selectedTab]
    );

    const handleScrollToTop = useCallback(() => {
        listRef.current?.scrollToIndex({
            index: 0,
            animated: true,
            viewPosition: 0.5,
        });
    }, []);

    useEffect(() => {
        listRef.current?.scrollToIndex({
            index: 0,
            animated: false,
            viewPosition: 0.5,
        });
    }, [selectedTab]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <SafeAreaView style={styles.container}>
            <NoticePageHeader
                selectedTab={selectedTab}
                onTabPress={handleTabPress}
            />
            <NoticePreviewList
                data={items}
                ref={listRef}
                onEndReached={handleEndReached}
                isFetchingNextPage={isFetchingNextPage}
            />
            <ScrollButton onPress={handleScrollToTop} />
            <TabBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        paddingBottom: 50,
    },
});
