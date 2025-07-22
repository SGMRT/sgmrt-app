import { CourseResponse } from "@/src/apis/types/course";
import { StyleSheet, View } from "react-native";
import CourseInfoItem from "./CourseInfoItem";

export default function CoursesInfoList({
    courses,
    selectedCourse,
    setSelectedCourse,
}: {
    courses: CourseResponse[];
    selectedCourse: CourseResponse | null;
    setSelectedCourse: (course: CourseResponse | null) => void;
}) {
    return (
        <View style={styles.container}>
            {courses.map((course) => (
                <CourseInfoItem
                    key={course.id}
                    isSelected={selectedCourse?.id === course.id}
                    onPress={() => setSelectedCourse(course)}
                    distance={course.distance}
                    duration={0}
                    averagePace={0}
                    cadence={0}
                    runnerCount={course.runnersCount}
                    courseName={course.name}
                    courseId={course.id}
                    runningId={null}
                    ghostRunningId={null}
                    startedAt={null}
                    historyName={null}
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
