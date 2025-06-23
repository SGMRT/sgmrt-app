import { Course } from "@/src/types/course";
import { useState } from "react";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

interface HomeMapProps {
    courses: Course[];
    handlePresentModalPress: () => void;
}

export default function HomeMap({
    courses,
    handlePresentModalPress,
}: HomeMapProps) {
    const [activeCourse, setActiveCourse] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState(16);
    const onClickCourse = (course: Course) => {
        setActiveCourse(course.id);
        handlePresentModalPress();
    };

    const onZoomLevelChanged = (currentZoomLevel: number) => {
        if (zoomLevel > 14.5 && currentZoomLevel <= 14.5) {
            setZoomLevel(currentZoomLevel);
            console.log("zoomLevel", zoomLevel);
        } else if (zoomLevel <= 14.5 && currentZoomLevel > 14.5) {
            setZoomLevel(currentZoomLevel);
            console.log("zoomLevel", zoomLevel);
        }
    };

    return (
        <MapViewWrapper onZoomLevelChanged={onZoomLevelChanged}>
            {courses.map((course) => (
                <CourseMarkers
                    key={course.id}
                    course={course}
                    activeCourse={activeCourse}
                    onClickCourse={onClickCourse}
                    zoomLevel={zoomLevel}
                />
            ))}
        </MapViewWrapper>
    );
}
