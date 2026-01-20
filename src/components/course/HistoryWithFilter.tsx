import { RunResponse } from "@/src/apis/types/run";
import { formatDate } from "@/src/utils/formatDate";
import { getDate } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { GoRunCalendar } from "../calendar/GoRunCalendar";
import { BottomModal, DualFilter, EmptyListView, FilterBar, ScrollButton, Section } from "@/src/components/ui";
import { RunHistoryItem } from "./RunHistoryItem";
import { RunHistoryGalleryItem } from "./RunHistoryGalleryItem";

type HistoryWithFilterProps = {
    data: RunResponse[];
    onClickItem: (history: RunResponse) => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    isFetchingNextPage?: boolean;
};

type FilteredData = {
    type: "date" | "course";
    data: DataGroup[];
};

type DataGroup = {
    label: string;
    data: RunResponse[];
};

export const HistoryWithFilter = ({
    data,
    onClickItem,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    searchPeriod,
    setSearchPeriod,
    selectedFilter,
    setSelectedFilter,
}: HistoryWithFilterProps & {
    searchPeriod: { startDate: Date; endDate: Date };
    setSearchPeriod: (period: { startDate: Date; endDate: Date }) => void;
    selectedFilter: "date" | "course";
    setSelectedFilter: (type: "date" | "course") => void;
}) => {
    const [selectedView, setSelectedView] = useState<"list" | "gallery">(
        "list"
    );
    const [displayData, setDisplayData] = useState<FilteredData>({
        type: "date",
        data: [],
    });
    const [bottomSheetType, setBottomSheetType] = useState<
        "date" | "filter" | "view"
    >("date");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollViewRef = useRef<any>(null);

    const dateGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, RunResponse[]>();

        data.forEach((item) => {
            const date = formatDate(new Date(item.startedAt));
            if (!groups.has(date)) {
                groups.set(date, []);
            }
            groups.get(date)?.push(item);
        });

        const dateData = Array.from(groups.entries()).map(([label, data]) => ({
            label,
            data,
        }));

        return { type: "date", data: dateData };
    }, [data]);

    const courseGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, RunResponse[]>();

        data.forEach((item) => {
            const course = item.courseInfo?.name ?? null;
            if (!course) {
                if (!groups.has("")) {
                    groups.set("", []);
                }
                groups.get("")!.push(item);
                return;
            }
            if (!groups.has(course)) {
                groups.set(course, [item]);
            } else {
                groups.get(course)?.push(item);
            }
        });

        const courseData = Array.from(groups.entries())
            .map(([label, data]) => ({
                label,
                data,
            }))
            .sort((a, b) => {
                if (a.label === "") {
                    return 1;
                }
                if (b.label === "") {
                    return -1;
                }
                return 0;
            });

        return { type: "course", data: courseData };
    }, [data]);

    useEffect(() => {
        if (selectedFilter === "date") {
            setDisplayData(dateGroups);
        } else {
            setDisplayData(courseGroups);
        }
    }, [selectedFilter, dateGroups, courseGroups]);

    const onPressFilterItem = (type: "date" | "filter" | "view") => {
        setBottomSheetType(type);
        bottomSheetRef.current?.present();
    };

    const onPressFilterType = (type: "date" | "course") => {
        setSelectedFilter(type);
        bottomSheetRef.current?.close();
    };

    const onPressViewType = (type: "list" | "gallery") => {
        setSelectedView(type);
        bottomSheetRef.current?.close();
    };

    const router = useRouter();
    return (
        <View style={{ flex: 1, gap: 20 }}>
            <FilterBar
                searchPeriod={searchPeriod}
                setSearchPeriod={setSearchPeriod}
                onClickFilter={onPressFilterItem}
                selectedFilter={selectedFilter}
                selectedView={selectedView}
            />
            <FlashList
                ref={scrollViewRef}
                data={displayData.data}
                style={{ paddingHorizontal: 16.5 }}
                contentContainerStyle={{
                    paddingBottom: 100,
                }}
                ListEmptyComponent={
                    <Section>
                        <EmptyListView
                            description={`기록이 없다고요? 괜찮아요\n당신의 첫 러닝은 바로 오늘이 될 수 있어요`}
                        />
                    </Section>
                }
                renderItem={({ item, index }) => (
                    <Section
                        key={item.label + index}
                        title={item.label}
                        titleVariant="sectionhead"
                        titleColor="white"
                        containerStyle={
                            displayData.data.length - 1 !== index
                                ? { marginBottom: 20 }
                                : {}
                        }
                        style={{
                            gap: 20,
                        }}
                    >
                        {item.data.map((history) =>
                            selectedView === "list" ? (
                                <RunHistoryItem
                                    key={history.runningId}
                                    mode={
                                        history.ghostRunningId
                                            ? "GHOST"
                                            : "SOLO"
                                    }
                                    name={history.name}
                                    courseName={
                                        selectedFilter === "date"
                                            ? history.courseInfo?.name ?? null
                                            : getDate(history.startedAt)
                                    }
                                    distance={history.recordInfo.distance}
                                    duration={history.recordInfo.duration}
                                    averagePace={history.recordInfo.averagePace}
                                    cadence={history.recordInfo.cadence}
                                    onShowHistory={() => {
                                        router.push(
                                            `/stats/result/${
                                                history.runningId
                                            }/${history.courseInfo?.id ?? -1}/${
                                                history.ghostRunningId ?? -1
                                            }`
                                        );
                                    }}
                                    isSelected={false}
                                />
                            ) : (
                                <RunHistoryGalleryItem
                                    key={history.runningId}
                                    mode={
                                        history.ghostRunningId
                                            ? "GHOST"
                                            : "SOLO"
                                    }
                                    imageUrl={history.screenShotUrl ?? ""}
                                    name={history.name}
                                    courseName={
                                        history.courseInfo?.name ?? null
                                    }
                                    distance={history.recordInfo.distance}
                                    duration={history.recordInfo.duration}
                                    averagePace={history.recordInfo.averagePace}
                                    cadence={history.recordInfo.cadence}
                                    onShowHistory={() => {
                                        router.push(
                                            `/stats/result/${
                                                history.runningId
                                            }/${history.courseInfo?.id ?? -1}/${
                                                history.ghostRunningId ?? -1
                                            }`
                                        );
                                    }}
                                    isSelected={false}
                                    startedAt={history.startedAt}
                                    selectedFilter={selectedFilter}
                                />
                            )
                        )}
                    </Section>
                )}
                showsVerticalScrollIndicator={false}
                extraData={selectedFilter}
                onEndReached={
                    hasNextPage
                        ? () => {
                              if (!isFetchingNextPage) {
                                  fetchNextPage();
                              }
                          }
                        : undefined
                }
                onEndReachedThreshold={0.5}
            />
            <ScrollButton
                onPress={() => {
                    scrollViewRef.current?.scrollTo({
                        y: 0,
                        animated: true,
                    });
                }}
            />
            <BottomModal bottomSheetRef={bottomSheetRef}>
                {bottomSheetType === "date" && (
                    <GoRunCalendar
                        period={searchPeriod}
                        setPeriod={setSearchPeriod}
                    />
                )}
                {bottomSheetType === "filter" && (
                    <DualFilter
                        firstLabel="날짜별"
                        secondLabel="코스별"
                        onPressFirst={() => {
                            onPressFilterType("date");
                        }}
                        onPressSecond={() => {
                            onPressFilterType("course");
                        }}
                        selected={
                            selectedFilter === "date" ? "first" : "second"
                        }
                        style={{ marginBottom: 30 }}
                    />
                )}
                {bottomSheetType === "view" && (
                    <DualFilter
                        firstLabel="목록"
                        secondLabel="앨범"
                        onPressFirst={() => onPressViewType("list")}
                        onPressSecond={() => onPressViewType("gallery")}
                        selected={selectedView === "list" ? "first" : "second"}
                        style={{ marginBottom: 30 }}
                    />
                )}
            </BottomModal>
        </View>
    );
};
