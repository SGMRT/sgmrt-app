import { UserCourseInfo } from "@/src/apis/types/course";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import CourseInfoItem from "../map/courseInfo/CourseInfoItem";
import ExpendHeader from "../ui/ExpendHeader";
import { Typography } from "../ui/Typography";

type CoursesWithFilterProps = {
    data: UserCourseInfo[];
    selectedCourse: UserCourseInfo | null;
    setSelectedCourse: (course: UserCourseInfo | null) => void;
    onClickFilter: () => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
};

export const CoursesWithFilter = ({
    data,
    selectedCourse,
    setSelectedCourse,
    onClickFilter,
    hasNextPage,
    fetchNextPage,
}: CoursesWithFilterProps) => {
    return (
        <View style={{ flex: 1, gap: 15 }}>
            <ExpendHeader
                title="2025"
                titleColor="gray40"
                marginHorizontal={true}
                rightChildren={
                    <Typography variant="body2" color="gray60">
                        필터
                    </Typography>
                }
                onPress={onClickFilter}
            />
            <FlashList
                data={data}
                renderItem={({ item }) => (
                    <CourseInfoItem
                        distance={item.distance / 1000}
                        duration={item.averageCompletionTime}
                        averagePace={item.averageFinisherPace}
                        cadence={item.averageFinisherCadence}
                        runnerCount={item.uniqueRunnersCount}
                        courseName={item.name}
                        courseId={item.id}
                        runningId={-1}
                        ghostRunningId={-1}
                        startedAt={item.createdAt}
                        historyName={item.name}
                        isSelected={selectedCourse?.id === item.id}
                        onPress={() => setSelectedCourse(item)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                extraData={selectedCourse?.id}
                estimatedItemSize={83}
                onEndReached={hasNextPage ? fetchNextPage : undefined}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
};
