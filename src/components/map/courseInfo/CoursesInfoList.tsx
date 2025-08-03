import { CourseResponse } from "@/src/apis/types/course";
import { StyleSheet, View } from "react-native";
import CourseInfoItem from "./CourseInfoItem";

export default function CoursesInfoList({
    courses,
    selectedCourse,
    setSelectedCourse,
    onClickCourse,
}: {
    courses: CourseResponse[];
    selectedCourse: CourseResponse | null;
    setSelectedCourse: (course: CourseResponse | null) => void;
    onClickCourse?: (course: CourseResponse) => void;
}) {
    return (
        <View style={styles.container}>
            {courses.map((course) => (
                <CourseInfoItem
                    key={course.id}
                    isSelected={selectedCourse?.id === course.id}
                    onPress={() => {
                        if (onClickCourse) {
                            onClickCourse(course);
                            setSelectedCourse(course);
                        } else {
                            setSelectedCourse(course);
                        }
                    }}
                    distance={course.distance / 1000}
                    duration={0}
                    averagePace={0}
                    cadence={0}
                    runnerCount={course.runnersCount}
                    courseName={null}
                    courseId={course.id}
                    runningId={null}
                    ghostRunningId={null}
                    startedAt={null}
                    historyName={course.name}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 20,
    },
});
