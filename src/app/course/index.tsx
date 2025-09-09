import { UserCourseInfo } from "@/src/apis/types/course";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserCourses } from "../(tabs)/(profile)/profile";

export default function CourseScreen() {
    const [selectedCourse, setSelectedCourse] = useState<UserCourseInfo | null>(
        null
    );
    const { data, isLoading, isError, fetchNextPage, hasNextPage } =
        useUserCourses();

    useEffect(() => {
        if (selectedCourse !== null) return;
        const firstCourse = data?.pages.flatMap((page) => page.content).at(0);
        if (firstCourse) {
            setSelectedCourse(firstCourse);
        }
    }, [data, selectedCourse]);

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
            {data?.pages.flatMap((page) => page.content).length === 0 && (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography color="gray40">
                        등록된 코스 정보가 존재하지 않습니다.
                    </Typography>
                    <Typography color="gray40">
                        러닝을 통해 코스를 등록해주세요.
                    </Typography>
                </View>
            )}
            {selectedCourse && (
                <SlideToAction
                    label="이 코스로 러닝 시작"
                    onSlideSuccess={() => {
                        router.push(`/run/${selectedCourse?.id}/-1`);
                    }}
                    color="green"
                    direction="left"
                />
            )}
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
