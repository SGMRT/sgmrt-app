import { getUserCourses } from "@/src/apis";
import { GhostSortOption, UserCourseInfo } from "@/src/apis/types/course";
import { useInfiniteQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { CoursesWithFilter } from "../course/CoursesWithFilter";
import { Typography } from "../ui/Typography";

export const CourseSection = ({
    selectedCourse,
    setSelectedCourse,
}: {
    selectedCourse: UserCourseInfo | null;
    setSelectedCourse: (course: UserCourseInfo | null) => void;
}) => {
    const { data, isLoading, isError, fetchNextPage, hasNextPage } =
        useUserCourses();

    const handleSelectCourse = (course: UserCourseInfo | null) => {
        if (selectedCourse?.id === course?.id) {
            setSelectedCourse(null);
        } else {
            setSelectedCourse(course);
        }
    };

    if (isLoading) {
        return <></>;
    }
    if (isError) {
        return <Typography>코스 정보를 불러오는데 실패했습니다.</Typography>;
    }
    return (
        <View style={{ marginTop: 20, flex: 1 }}>
            <CoursesWithFilter
                data={data?.pages.flatMap((page) => page.content) ?? []}
                selectedCourse={selectedCourse}
                setSelectedCourse={handleSelectCourse}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                filters={{
                    date: true,
                    filter: false,
                    view: false,
                }}
                defaultView="gallery"
                showLogo={false}
            />
        </View>
    );
};

export function useUserCourses(
    size: number = 10,
    sort: GhostSortOption = "id,asc"
) {
    return useInfiniteQuery({
        queryKey: ["user-courses", size, sort],
        queryFn: async ({ pageParam = 0 }) =>
            getUserCourses({ page: pageParam, size, sort }),
        getNextPageParam: (lastPage) => {
            const { number, totalPages } = lastPage.page;
            return number + 1 < totalPages ? number + 1 : undefined;
        },
        initialPageParam: 0,
    });
}
