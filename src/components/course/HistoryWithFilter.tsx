import { DefaultLogo } from "@/assets/icons/icons";
import { ChevronIcon, GhostIcon } from "@/assets/svgs/svgs";
import { RunResponse } from "@/src/apis/types/run";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
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
                                        history.courseInfo?.name ?? null
                                    }
                                    distance={history.recordInfo.distance}
                                    duration={history.recordInfo.duration}
                                    averagePace={history.recordInfo.averagePace}
                                    cadence={history.recordInfo.cadence}
                                    onPress={() => {
                                        onClickItem(history);
                                    }}
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
                                    onPress={() => {
                                        onClickItem(history);
                                    }}
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
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image
                    source={imageUrl ? { uri: imageUrl } : DefaultLogo}
                    style={styles.image}
                />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.contentHeader}>
                    <View style={styles.nameContainer}>
                        {mode === "GHOST" && (
                            <View style={styles.iconContainer}>
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
                    <View style={styles.content}>
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
                    <View style={styles.content}>
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
                        style={styles.dateContainer}
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
        <View style={styles.itemContainer}>
            <View style={{ gap: 2 }}>
                <View style={styles.nameContainer}>
                    {mode === "GHOST" && (
                        <View style={styles.iconContainer}>
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
                        style={styles.dateContainer}
                    >
                        {courseName && (
                            <View style={styles.nameContainer}>
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
                <View style={styles.content}>
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

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    container: {
        flexDirection: "row",
        gap: 20,
        alignItems: "center",
    },
    imageContainer: {
        backgroundColor: colors.gray[80],
        width: 120,
        height: 120,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 10,
    },
    contentContainer: {
        gap: 5,
        flex: 1,
    },
    contentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    iconContainer: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: "rgba(226, 255, 0, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
