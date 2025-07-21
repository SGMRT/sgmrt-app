import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import CourseInfoItem from "../map/courseInfo/CourseInfoItem";
import ExpendHeader from "../ui/ExpendHeader";
import { Typography } from "../ui/Typography";

export const CoursesWithFilter = ({
    data,
    selectedCourseId,
    setSelectedCourseId,
    onClickFilter,
}: {
    data: any[];
    selectedCourseId: number | null;
    setSelectedCourseId: (id: number | null) => void;
    onClickFilter: () => void;
}) => {
    return (
        <View style={{ flex: 1, gap: 15 }}>
            <ExpendHeader
                title="2025"
                titleColor="gray40"
                marginHorizontal={true}
                rightChildren={
                    <Typography variant="body1" color="gray60">
                        필터
                    </Typography>
                }
                onPress={onClickFilter}
            />
            <FlashList
                data={data}
                renderItem={({ item, index }) => (
                    <CourseInfoItem
                        isSelected={selectedCourseId === item.id}
                        onPress={() => setSelectedCourseId(item.id)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                extraData={selectedCourseId}
                estimatedItemSize={83}
            />
        </View>
    );
};
