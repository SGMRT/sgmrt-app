import { ChevronIcon, GhostIcon } from "@/assets/svgs/svgs";
import { RunResponse } from "@/src/apis/types/run";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import BottomModal from "../ui/BottomModal";
import { Divider } from "../ui/Divider";
import { DualFilter } from "../ui/DualFilter";
import EmptyListView from "../ui/EmptyListView";
import { FilterBar } from "../ui/FilterBar";
import { GoRunCalendar } from "../ui/GoRunCalendar";
import RadioButton from "../ui/RadioButton";
import Section from "../ui/Section";
import { Typography } from "../ui/Typography";

type HistoryWithFilterProps = {
    mode: "SOLO" | "GHOST";
    data: RunResponse[];
    isDeleteMode: boolean;
    selectedItem: RunResponse | null;
    selectedDeleteItem: RunResponse[];
    onClickItem: (history: RunResponse) => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
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
    mode,
    data,
    isDeleteMode,
    selectedItem,
    selectedDeleteItem,
    onClickItem,
    hasNextPage,
    fetchNextPage,
}: HistoryWithFilterProps) => {
    const [selectedFilter, setSelectedFilter] = useState<"date" | "course">(
        "date"
    );
    const [selectedView, setSelectedView] = useState<"list" | "gallery">(
        "list"
    );
    const [displayData, setDisplayData] = useState<FilteredData>({
        type: "date",
        data: [],
    });
    const [searchPeriod, setSearchPeriod] = useState<{
        startDate: Date;
        endDate: Date;
    }>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        endDate: new Date(),
    });
    const [bottomSheetType, setBottomSheetType] = useState<
        "date" | "filter" | "view"
    >("date");
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const createdAt = new Date(item.startedAt);
            return (
                createdAt >= searchPeriod.startDate &&
                createdAt <= searchPeriod.endDate
            );
        });
    }, [data, searchPeriod]);

    const dateGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, RunResponse[]>();

        filteredData.forEach((item) => {
            const date = formatDate(new Date(item.startedAt));
            if (!groups.has(date)) {
                groups.set(date, []);
            }
            groups.get(date)?.push(item);
        });

        const data = Array.from(groups.entries()).map(([label, data]) => ({
            label,
            data,
        }));

        return { type: "date", data };
    }, [filteredData]);

    const courseGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, RunResponse[]>();

        filteredData.forEach((item) => {
            const course = item.courseInfo.name ?? null;
            if (!course) {
                if (!groups.has("")) {
                    groups.set("", [item]);
                }
                groups.get("")?.push(item);
                return;
            }
            if (!groups.has(course)) {
                groups.set(course, [item]);
            } else {
                groups.get(course)?.push(item);
            }
        });

        const data = Array.from(groups.entries())
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

        return { type: "course", data };
    }, [filteredData]);

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
            />
            <FlashList
                data={displayData.data}
                style={{ paddingHorizontal: 16.5 }}
                ListEmptyComponent={
                    <Section>
                        <EmptyListView
                            description={`기록이 없다고요? 괜찮아요\n당신의 첫 러닝은 바로 오늘이 될 수 있어요`}
                        />
                    </Section>
                }
                renderItem={({ item, index }) => (
                    <Section
                        key={item.label}
                        title={item.label}
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
                                    mode={mode}
                                    name={history.name}
                                    courseName={history.courseInfo.name}
                                    distance={history.recordInfo.distance}
                                    duration={history.recordInfo.duration}
                                    averagePace={history.recordInfo.averagePace}
                                    cadence={history.recordInfo.cadence}
                                    onPress={() => {
                                        onClickItem(history);
                                    }}
                                    onShowHistory={() => {
                                        router.push(
                                            `/result/${history.runningId}/${
                                                history.courseInfo.id ?? -1
                                            }/${history.ghostRunningId ?? -1}`
                                        );
                                    }}
                                    isSelected={
                                        isDeleteMode
                                            ? selectedDeleteItem.includes(
                                                  history
                                              )
                                            : history.runningId ===
                                              selectedItem?.runningId
                                    }
                                />
                            ) : (
                                <RunHistoryGalleryItem
                                    key={history.runningId}
                                    mode={mode}
                                    imageUrl={"https://picsum.photos/200/300"}
                                    name={history.name}
                                    courseName={history.courseInfo.name}
                                    distance={history.recordInfo.distance}
                                    duration={history.recordInfo.duration}
                                    averagePace={history.recordInfo.averagePace}
                                    cadence={history.recordInfo.cadence}
                                    onPress={() => {
                                        onClickItem(history);
                                    }}
                                    onShowHistory={() => {
                                        router.push(
                                            `/result/${history.runningId}/${
                                                history.courseInfo.id ?? -1
                                            }/${history.ghostRunningId ?? -1}`
                                        );
                                    }}
                                    isSelected={
                                        isDeleteMode
                                            ? selectedDeleteItem.includes(
                                                  history
                                              )
                                            : history.runningId ===
                                              selectedItem?.runningId
                                    }
                                    startedAt={history.startedAt}
                                />
                            )
                        )}
                    </Section>
                )}
                showsVerticalScrollIndicator={false}
                extraData={selectedItem?.runningId}
                onEndReached={hasNextPage ? fetchNextPage : undefined}
                onEndReachedThreshold={0.5}
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
                        secondLabel="갤러리"
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

interface RunHistoryGalleryItemProps {
    mode: "SOLO" | "GHOST";
    imageUrl: string;
    name: string;
    courseName: string | null;
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    onPress: () => void;
    onShowHistory: () => void;
    isSelected: boolean;
    startedAt: number;
}

const RunHistoryGalleryItem = ({
    mode,
    imageUrl,
    name,
    distance,
    duration,
    averagePace,
    cadence,
    onPress,
    onShowHistory,
    isSelected,
    startedAt,
}: RunHistoryGalleryItemProps) => {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: 20,
                alignItems: "center",
            }}
        >
            <View
                style={{
                    backgroundColor: "gray",
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography variant="headline" color="white">
                    준비 중
                </Typography>
            </View>
            <View style={{ gap: 5, flex: 1 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        {mode === "GHOST" && (
                            <View
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    backgroundColor: "rgba(226, 255, 0, 0.2)",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <GhostIcon
                                    width={12}
                                    height={12}
                                    color={colors.primary}
                                />
                            </View>
                        )}
                        <Typography
                            variant="subhead1"
                            color={isSelected ? "primary" : "gray20"}
                        >
                            {name}
                        </Typography>
                    </View>

                    <RadioButton
                        isSelected={isSelected}
                        showMyRecord={false}
                        onPress={onPress}
                        activeColor={colors.primary}
                        inactiveColor={colors.gray[40]}
                    />
                </View>
                <View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {distance.toFixed(2)}km
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {getRunTime(duration, "HH:MM:SS")}
                        </Typography>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {getFormattedPace(averagePace)}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {cadence}spm
                        </Typography>
                    </View>
                    <TouchableOpacity
                        onPress={onShowHistory}
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        <Typography
                            variant="body3"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {getDate(startedAt)}
                        </Typography>
                        <ChevronIcon
                            color={
                                isSelected ? colors.gray[20] : colors.gray[40]
                            }
                            width={18}
                            height={18}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

interface RunHistoryItemProps {
    mode: "SOLO" | "GHOST";
    name: string;
    courseName: string | null;
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    onPress: () => void;
    onShowHistory: () => void;
    isSelected: boolean;
}

const RunHistoryItem = ({
    mode,
    name,
    courseName,
    distance,
    duration,
    averagePace,
    cadence,
    onPress,
    onShowHistory,
    isSelected,
}: RunHistoryItemProps) => {
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <View style={{ gap: 2 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    {mode === "GHOST" && (
                        <View
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                backgroundColor: "rgba(226, 255, 0, 0.2)",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <GhostIcon
                                width={12}
                                height={12}
                                color={colors.primary}
                            />
                        </View>
                    )}
                    <Typography
                        variant="subhead1"
                        color={isSelected ? "primary" : "gray20"}
                    >
                        {name}
                    </Typography>
                    <TouchableOpacity
                        onPress={onShowHistory}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        {courseName && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: 6,
                                    alignItems: "center",
                                }}
                            >
                                <Divider />
                                <Typography
                                    variant="caption1"
                                    color={isSelected ? "gray20" : "gray40"}
                                >
                                    {courseName}
                                </Typography>
                            </View>
                        )}
                        <ChevronIcon
                            color={
                                isSelected ? colors.gray[20] : colors.gray[40]
                            }
                            width={18}
                            height={18}
                        />
                    </TouchableOpacity>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {distance.toFixed(2)}km
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {getRunTime(duration, "HH:MM:SS")}
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {getFormattedPace(averagePace)}
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {cadence}spm
                    </Typography>
                </View>
            </View>
            <RadioButton
                isSelected={isSelected}
                showMyRecord={false}
                onPress={onPress}
                activeColor={colors.primary}
                inactiveColor={colors.gray[40]}
            />
        </View>
    );
};
