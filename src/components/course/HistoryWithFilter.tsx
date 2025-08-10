import { RunResponse } from "@/src/apis/types/run";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import CourseInfoItem from "../map/courseInfo/CourseInfoItem";
import ExpendHeader from "../ui/ExpendHeader";
import { Typography } from "../ui/Typography";

type HistoryWithFilterProps = {
    data: RunResponse[];
    selectedCourse: RunResponse | null;
    setSelectedCourse: (course: RunResponse | null) => void;
    onClickFilter: () => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
};

export const HistoryWithFilter = ({
    data,
    selectedCourse,
    setSelectedCourse,
    onClickFilter,
    hasNextPage,
    fetchNextPage,
}: HistoryWithFilterProps) => {
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
                renderItem={({ item, index }) => (
                    <CourseInfoItem
                        distance={item.recordInfo.distance}
                        duration={item.recordInfo.duration}
                        averagePace={item.recordInfo.averagePace}
                        cadence={item.recordInfo.cadence}
                        runnerCount={null}
                        courseName={item.courseInfo.name ?? null}
                        courseId={item.courseInfo.id ?? -1}
                        runningId={item.runningId ?? -1}
                        ghostRunningId={-1}
                        startedAt={item.startedAt ?? null}
                        historyName={item.name ?? null}
                        isSelected={
                            selectedCourse?.runningId === item.runningId
                        }
                        onPress={() => setSelectedCourse(item)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                extraData={selectedCourse?.runningId}
                estimatedItemSize={83}
                onEndReached={hasNextPage ? fetchNextPage : undefined}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
};
