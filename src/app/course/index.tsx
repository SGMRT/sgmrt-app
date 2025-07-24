import { UserCourseInfo } from "@/src/apis/types/course";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserCourses } from "../(tabs)/(profile)/profile";

export default function CourseScreen() {
    const [selectedCourse, setSelectedCourse] = useState<UserCourseInfo | null>(
        null
    );
    const { data, isLoading, isError, fetchNextPage, hasNextPage } =
        useUserCourses();
    const router = useRouter();

    if (isLoading) {
        return <></>;
    }
    if (isError) {
        return <Typography>코스 정보를 불러오는데 실패했습니다.</Typography>;
    }
    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="내 코스" />
            <CoursesWithFilter
                data={data?.pages.flatMap((page) => page.content) ?? []}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                onClickFilter={() => {}}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
            />
            <SlideToAction
                label="이 코스로 러닝 시작"
                onSlideSuccess={() => {
                    router.push(`/run/${selectedCourse?.id}/-1`);
                }}
                color="green"
                direction="left"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        marginBottom: 20,
    },
    headerText: {
        marginBottom: 10,
    },
});
