import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { Course } from "@/src/types/course";
import { CircleLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { memo } from "react";

interface CourseProps {
    course: Course;
    isActive: boolean;
    onClickCourse?: (course: Course) => void;
}

export default memo(function CourseLayer({
    course,
    isActive,
    onClickCourse,
}: CourseProps) {
    return (
        <>
            <ShapeSource
                onPress={() => onClickCourse?.(course)}
                id={`line-source-${course.id}`}
                lineMetrics={1 as any}
                shape={{
                    type: "Feature",
                    properties: {
                        color: "#ffffff",
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: course.coordinates,
                    },
                }}
            >
                <LineLayer
                    id={`line-layer-${course.id}`}
                    style={
                        isActive
                            ? mapboxStyles.activeLineLayer
                            : mapboxStyles.inactiveLineLayer
                    }
                />
            </ShapeSource>
            <ShapeSource
                id={`end-point-source-${course.id}`}
                shape={{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates:
                            course.coordinates[course.coordinates.length - 1],
                    },
                    properties: {},
                }}
            >
                <CircleLayer
                    id={`end-point-layer-${course.id}`}
                    style={
                        isActive
                            ? mapboxStyles.activeCircle
                            : mapboxStyles.inactiveCircle
                    }
                />
            </ShapeSource>
        </>
    );
});
