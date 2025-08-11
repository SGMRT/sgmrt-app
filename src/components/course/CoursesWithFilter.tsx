import { CalendarIcon } from "@/assets/svgs/svgs";
import { UserCourseInfo } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Divider } from "../ui/Divider";
import { ButtonWithIcon, FilterButton } from "../ui/FilterButton";
import RadioButton from "../ui/RadioButton";
import Section from "../ui/Section";
import { Typography } from "../ui/Typography";
import { UserCount } from "../ui/UserCount";

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
        const groups: DataGroup[] = [];

        filteredData.forEach((item) => {
            const date = formatDate(new Date(item.createdAt));
            if (!groups.find((group) => group.label === date)) {
                groups.push({ label: date, data: [] });
            }
            groups.find((group) => group.label === date)?.data.push(item);
        });
        return { type: "date", data: groups };
    }, [filteredData]);

    const courseGroups: FilteredData = useMemo(() => {
        const groups: DataGroup[] = [];

        filteredData.forEach((item) => {
            const course = item.name;
            if (!groups.find((group) => group.label === course)) {
                groups.push({ label: course, data: [] });
            }
            groups.find((group) => group.label === course)?.data.push(item);
        });
        return { type: "course", data: groups };
    }, [filteredData]);

    useEffect(() => {
        if (selectedFilter === "date") {
            setDisplayData(dateGroups);
        } else {
            setDisplayData(courseGroups);
        }
    }, [selectedFilter, dateGroups, courseGroups]);

    return (
        <View style={{ flex: 1, gap: 20 }}>
            <FilterBar
                searchPeriod={searchPeriod}
                setSearchPeriod={setSearchPeriod}
            />
            <View style={{ paddingHorizontal: 16.5 }}>
                {displayData.data.map((group) => (
                    <Section
                        key={group.label}
                        title={group.label}
                        titleColor="white"
                        style={{ gap: 20 }}
                    >
                        {group.data.map((item) => (
                            <CourseItem
                                key={item.id}
                                courseName={item.name}
                                courseUserCount={item.uniqueRunnersCount}
                                courseId={item.id}
                                runningId={-1}
                                ghostRunningId={-1}
                                distance={item.distance / 1000}
                                duration={item.averageCompletionTime}
                                averagePace={item.averageFinisherPace}
                                cadence={item.averageFinisherCadence}
                                onPress={() => {}}
                                isSelected={item.id === selectedCourse?.id}
                            />
                        ))}
                    </Section>
                ))}
            </View>
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
                        onPress={() => {}}
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

interface FilterBarProps {
    searchPeriod: {
        startDate: Date;
        endDate: Date;
    };
    setSearchPeriod: (period: { startDate: Date; endDate: Date }) => void;
}

const FilterBar = ({ searchPeriod, setSearchPeriod }: FilterBarProps) => {
    return (
        <View style={styles.filterBar}>
            <ButtonWithIcon
                icon={<CalendarIcon />}
                // 25.06.21 형식으로 되도록
                title={`${formatDate(searchPeriod.startDate)} ~${formatDate(
                    searchPeriod.endDate
                )}`}
                onPress={() => {}}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
            <FilterButton
                onPress={() => {}}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
            <ButtonWithIcon
                title="보기 방식"
                onPress={() => {}}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
        </View>
    );
};

const formatDate = (date: Date) => {
    return date
        .toLocaleDateString("ko-KR", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
        })
        .slice(0, 10)
        .split(".")
        .map((item) => item.trim())
        .join(".");
};

const styles = StyleSheet.create({
    filterBar: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    pv5: {
        paddingVertical: 5,
    },
});
