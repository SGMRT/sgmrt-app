import { deleteCourses } from "@/src/apis";
import { UserCourseInfo } from "@/src/apis/types/course";
import {
    BottomModal,
    Divider,
    DualFilter,
    EmptyListView,
    FilterBar,
    RadioButton,
    Section,
    showToast,
    Typography,
    UserCount,
} from "@/src/components/ui";
import colors from "@/src/theme/colors";
import { endOfDay, formatDate, startOfDay } from "@/src/utils/formatDate";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoRunCalendar } from "../calendar/GoRunCalendar";
import { CourseGalleryItem } from "./CourseListView";

type CoursesWithFilterProps = {
    data: UserCourseInfo[];
    selectedCourse: UserCourseInfo | null;
    setSelectedCourse?: (course: UserCourseInfo | null) => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    filters: {
        date?: boolean;
        filter?: boolean;
        view?: boolean;
    };
    defaultView?: "list" | "gallery";
    showLogo?: boolean;
    isDeleteMode?: boolean;
    setIsDeleteMode?: (isDeleteMode: boolean) => void;
};

type FilteredData = {
    type: "date" | "course";
    data: DataGroup[];
};

type DataGroup = {
    label: string;
    data: UserCourseInfo[];
};

export const CoursesWithFilter = ({
    data,
    selectedCourse,
    setSelectedCourse,
    hasNextPage,
    fetchNextPage,
    filters,
    defaultView = "list",
    showLogo = true,
    isDeleteMode = false,
    setIsDeleteMode = () => {},
}: CoursesWithFilterProps) => {
    const queryClient = useQueryClient();
    const [selectedFilter, setSelectedFilter] = useState<"date" | "course">(
        "date",
    );
    const [selectedView, setSelectedView] = useState<"list" | "gallery">(
        defaultView,
    );
    const [displayData, setDisplayData] = useState<FilteredData>({
        type: "date",
        data: [],
    });
    const [searchPeriod, setSearchPeriod] = useState<{
        startDate: Date;
        endDate: Date;
    }>({
        startDate: startOfDay(
            new Date(new Date().setDate(new Date().getDate() - 30)),
        ),
        endDate: endOfDay(new Date()),
    });
    const [bottomSheetType, setBottomSheetType] = useState<
        "date" | "filter" | "view"
    >("date");
    const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(
        new Set(),
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();

    const toggleDeleteSelection = (courseId: number) => {
        setSelectedForDelete((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const createdAt = new Date(item.createdAt);
            return (
                createdAt >= searchPeriod.startDate &&
                createdAt <= searchPeriod.endDate
            );
        });
    }, [data, searchPeriod]);

    const dateGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, UserCourseInfo[]>();

        filteredData.forEach((item) => {
            const date = formatDate(new Date(item.createdAt));
            // Map에 해당 날짜의 그룹이 있는지 확인
            if (!groups.has(date)) {
                groups.set(date, []); // 없으면 새로운 배열과 함께 추가
            }
            groups.get(date)?.push(item); // 해당 그룹에 아이템 추가
        });

        // Map을 FlashList가 사용할 데이터 형태로 변환
        const data = Array.from(groups.entries()).map(([label, data]) => ({
            label,
            data,
        }));

        return { type: "date", data };
    }, [filteredData]);

    const courseGroups: FilteredData = useMemo(() => {
        const groups = new Map<string, UserCourseInfo[]>();

        filteredData.forEach((item) => {
            const course = item.name;
            if (!groups.has(course)) {
                groups.set(course, []);
            }
            groups.get(course)?.push(item);
        });

        // Map을 FlashList가 사용할 데이터 형태로 변환
        const data = Array.from(groups.entries()).map(([label, data]) => ({
            label,
            data,
        }));

        return { type: "course", data };
    }, [filteredData]);

    useEffect(() => {
        if (selectedFilter === "date") {
            setDisplayData(dateGroups);
        } else {
            setDisplayData(courseGroups);
        }
    }, [selectedFilter, dateGroups, courseGroups]);

    useEffect(() => {
        if (!isDeleteMode) {
            setSelectedForDelete(new Set());
        }
    }, [isDeleteMode]);

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

    const handleDelete = async () => {
        const selectedCourses = data.filter((course) =>
            selectedForDelete.has(course.id),
        );
        Alert.alert("코스를 삭제할까요?", "삭제된 코스는 복구가 어려워요", [
            {
                text: "삭제하기",
                onPress: async () => {
                    setIsDeleting(true);
                    try {
                        await deleteCourses(
                            selectedCourses.map((course) => course.id),
                        );
                        queryClient.invalidateQueries({
                            queryKey: ["user-courses"],
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["runs"],
                        });
                        selectedCourses.forEach((course) => {
                            queryClient.invalidateQueries({
                                queryKey: ["runsByCourse", course.id],
                            });
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["result"],
                        });
                        setSelectedForDelete(new Set());
                        setIsDeleteMode(false);
                        showToast("success", "코스가 삭제되었어요", bottom + 60);
                    } catch (error) {
                        showToast(
                            "info",
                            "코스 삭제에 실패했어요. 다시 시도해주세요.",
                            bottom + 60,
                        );
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
            {
                text: "나가기",
                style: "destructive",
                onPress: () => {},
            },
        ]);
    };

    return (
        <View style={{ flex: 1, gap: 20 }}>
            <FilterBar
                searchPeriod={searchPeriod}
                setSearchPeriod={setSearchPeriod}
                onClickFilter={onPressFilterItem}
                selectedFilter={selectedFilter}
                selectedView={selectedView}
                filters={filters}
                isDeleteMode={isDeleteMode}
                selectedCount={selectedForDelete.size}
                onDelete={handleDelete}
                isLoading={isDeleting}
            />
            <FlashList
                style={{ paddingHorizontal: 16.5 }}
                data={displayData.data}
                ListEmptyComponent={
                    <Section>
                        <EmptyListView
                            description={`등록된 코스 정보가 존재하지 않습니다.\n러닝을 통해 코스를 등록해주세요.`}
                        />
                    </Section>
                }
                renderItem={({ item, index }) => (
                    <Section
                        key={item.label}
                        title={item.label}
                        titleColor="white"
                        titleVariant="headline"
                        containerStyle={
                            displayData.data.length - 1 !== index
                                ? { marginBottom: 20 }
                                : {}
                        }
                        style={{
                            gap: 20,
                        }}
                    >
                        {item.data.map((course) =>
                            selectedView === "list" ? (
                                <CourseItem
                                    key={course.id}
                                    courseName={course.name}
                                    courseUserCount={course.totalRunsCount}
                                    courseId={course.id}
                                    runningId={-1}
                                    ghostRunningId={-1}
                                    distance={course.distance / 1000}
                                    duration={course.averageCompletionTime}
                                    averagePace={course.averageFinisherPace}
                                    cadence={course.averageFinisherCadence}
                                    onClickCourseInfo={() => {
                                        router.push(
                                            `/profile/${course.id}/detail`,
                                        );
                                    }}
                                    isSelected={
                                        course.id === selectedCourse?.id
                                    }
                                    showLogo={showLogo}
                                />
                            ) : (
                                <CourseGalleryItem
                                    key={course.id}
                                    courseName={course.name}
                                    distance={course.distance / 1000}
                                    elevation={course.elevationGain ?? 0}
                                    index={index}
                                    userCount={course.totalRunsCount}
                                    maxLength={item.data.length}
                                    imageUrl={course.thumbnailUrl}
                                    isSelected={
                                        course.id === selectedCourse?.id
                                    }
                                    onClickCourse={
                                        isDeleteMode
                                            ? undefined
                                            : () => {
                                                  router.push(
                                                      `/profile/${course.id}/detail`,
                                                  );
                                              }
                                    }
                                    showLogo={showLogo}
                                    isDeleteMode={isDeleteMode}
                                    isChecked={selectedForDelete.has(course.id)}
                                    onCheck={() =>
                                        toggleDeleteSelection(course.id)
                                    }
                                />
                            ),
                        )}
                    </Section>
                )}
                showsVerticalScrollIndicator={false}
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
                        description="정렬 방식"
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
                        description="보기 방식"
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

type CourseItemProps = {
    // 표시 정보
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    courseName: string;
    courseUserCount: number;
    // 라우팅 정보
    courseId: number;
    runningId: number;
    ghostRunningId: number;
    // 이벤트 핸들러
    onPress?: () => void;
    onClickCourseInfo: () => void;
    // 선택 상태
    isSelected: boolean;
    showLogo?: boolean;
};

const CourseItem = ({
    distance,
    duration,
    averagePace,
    cadence,
    courseName,
    courseUserCount,
    courseId,
    runningId,
    ghostRunningId,
    onClickCourseInfo,
    onPress,
    isSelected,
    showLogo = true,
}: CourseItemProps) => {
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
                    <Typography
                        variant="subhead1"
                        color={isSelected ? "primary" : "gray20"}
                    >
                        {courseName}
                    </Typography>
                    <Divider />
                    <UserCount
                        userCount={courseUserCount}
                        onPress={onClickCourseInfo}
                        color={isSelected ? "gray20" : "gray40"}
                        iconColor={
                            isSelected ? colors.gray[20] : colors.gray[40]
                        }
                        variant="caption1"
                    />
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
                        {getRunTime(duration, "HH:MM:SS_IF_HH_EXISTS")}
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
            {onPress && (
                <RadioButton
                    isSelected={isSelected}
                    showMyRecord={false}
                    onPress={onPress}
                />
            )}
        </View>
    );
};
