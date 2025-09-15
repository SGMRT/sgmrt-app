import { CourseResponse } from "@/src/apis/types/course";
import { MarkerView } from "@rnmapbox/maps";
import { View } from "react-native";
import CourseLayer from "./CourseLayer";
import CourseTitle from "./CourseTitle";

interface CourseMarkersProps {
    course: CourseResponse;
    activeCourseId: number;
    onClickCourse: (course: CourseResponse) => void;
    zoomLevel: number;
    logo?: boolean;
}

export default function CourseMarkers({
    course,
    activeCourseId,
    onClickCourse,
    zoomLevel,
}: CourseMarkersProps) {
    return (
        <View>
            <MarkerView
                id={`marker-view-${course.id}`}
                coordinate={[course.startLng, course.startLat]}
                anchor={{ x: 0.5, y: 1.0 }}
            >
                <CourseTitle
                    course={course}
                    onClickCourse={onClickCourse}
                    isActive={activeCourseId === course.id}
                    zoomLevel={zoomLevel}
                />
            </MarkerView>
            <CourseLayer
                course={course}
                isActive={activeCourseId === course.id}
                onClickCourse={onClickCourse}
            />
        </View>
    );
}
