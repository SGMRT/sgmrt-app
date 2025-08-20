import { UserCourseInfo } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import BottomModal from "../ui/BottomModal";
import { Divider } from "../ui/Divider";
import { DualFilter } from "../ui/DualFilter";
import EmptyListView from "../ui/EmptyListView";
import { FilterBar } from "../ui/FilterBar";
import { GoRunCalendar } from "../ui/GoRunCalendar";
import RadioButton from "../ui/RadioButton";
import Section from "../ui/Section";
import { Typography } from "../ui/Typography";
import { UserCount } from "../ui/UserCount";
import { CourseGalleryItem } from "./CourseListView";

type CoursesWithFilterProps = {
    data: UserCourseInfo[];
    selectedCourse: UserCourseInfo | null;
    setSelectedCourse: (course: UserCourseInfo | null) => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
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
}: CoursesWithFilterProps) => {
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
    const router = useRouter();

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

    return (
        <View style={{ flex: 1, gap: 20 }}>
            <FilterBar
                searchPeriod={searchPeriod}
                setSearchPeriod={setSearchPeriod}
                onClickFilter={onPressFilterItem}
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
                                    onPress={() => {
                                        setSelectedCourse(course);
                                    }}
                                    onClickCourseInfo={() => {
                                        router.push(
                                            `/course/${course.id}/detail`
                                        );
                                    }}
                                    isSelected={
                                        course.id === selectedCourse?.id
                                    }
                                />
                            ) : (
                                <CourseGalleryItem
                                    key={course.id}
                                    courseName={course.name}
                                    distance={course.distance / 1000}
                                    elevation={0}
                                    index={index}
                                    userCount={course.totalRunsCount}
                                    maxLength={item.data.length}
                                    imageUrl={course.thumbnailUrl}
                                    isSelected={
                                        course.id === selectedCourse?.id
                                    }
                                    onClickCourse={() => {
                                        setSelectedCourse(course);
                                    }}
                                    onClickCourseInfo={() => {
                                        console.log(course.id);
                                        router.push(
                                            `/course/${course.id}/rank`
                                        );
                                    }}
                                />
                            )
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
    onPress: () => void;
    onClickCourseInfo: () => void;
    // 선택 상태
    isSelected: boolean;
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
            />
        </View>
    );
};
