import { useState } from "react";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";
import { Course } from "@/src/types/course";

interface HomeMapProps {
    courses: Course[];
    handlePresentModalPress: () => void;
}

export default function HomeMap({
    courses,
    handlePresentModalPress,
}: HomeMapProps) {
    const [activeCourse, setActiveCourse] = useState<number>(0);
    const onClickCourse = (course: Course) => {
        setActiveCourse(course.id);
        handlePresentModalPress();
    };
    return (
        <MapViewWrapper>
            {courses.map((course) => (
                <CourseMarkers
                    key={course.id}
                    course={course}
                    activeCourse={activeCourse}
                    onClickCourse={onClickCourse}
                />
            ))}
        </MapViewWrapper>
    );
}
