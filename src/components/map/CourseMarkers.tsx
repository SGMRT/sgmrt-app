import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { Course } from "@/src/types/course";
import {
    CircleLayer,
    LineLayer,
    MarkerView,
    ShapeSource,
} from "@rnmapbox/maps";
import { View } from "react-native";
import CourseTitle from "./CourseTitle";

interface CourseMarkersProps {
    course: Course;
    activeCourse: number;
    onClickCourse: (course: Course) => void;
    zoomLevel: number;
}

export default function CourseMarkers({
    course,
    activeCourse,
    onClickCourse,
    zoomLevel,
}: CourseMarkersProps) {
    console.log("zoomLevel", zoomLevel);
    return (
        <View>
            <MarkerView
                id={`marker-view-${course.id}`}
                coordinate={course.coordinates[0]}
                anchor={{ x: 0.5, y: 0.7 }}
            >
                <CourseTitle
                    course={course}
                    onClickCourse={onClickCourse}
                    isActive={activeCourse === course.id}
                    zoomLevel={zoomLevel}
                />
            </MarkerView>
            <ShapeSource
                onPress={() => onClickCourse(course)}
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
                        activeCourse === course.id
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
                        activeCourse === course.id
                            ? mapboxStyles.activeCircle
                            : mapboxStyles.inactiveCircle
                    }
                />
            </ShapeSource>
        </View>
    );
}
