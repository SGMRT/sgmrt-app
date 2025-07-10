import { CourseResponse } from "@/src/apis/types/course";
import { MarkerView } from "@rnmapbox/maps";
import { View } from "react-native";
import CourseLayer from "./CourseLayer";
import CourseTitle from "./CourseTitle";

interface CourseMarkersProps {
    course: CourseResponse;
    activeCourse: number;
    onClickCourse: (course: CourseResponse) => void;
    zoomLevel: number;
}

export default function CourseMarkers({
    course,
    activeCourse,
    onClickCourse,
    zoomLevel,
}: CourseMarkersProps) {
    return (
        <View>
            <MarkerView
                id={`marker-view-${course.id}`}
                coordinate={[course.startLng, course.startLat]}
                anchor={{ x: 0.5, y: 0.7 }}
            >
                <CourseTitle
                    course={course}
                    onClickCourse={onClickCourse}
                    isActive={activeCourse === course.id}
                    zoomLevel={zoomLevel}
                />
            </MarkerView>
            <CourseLayer
                course={course}
                isActive={activeCourse === course.id}
                onClickCourse={onClickCourse}
            />
        </View>
    );
}
