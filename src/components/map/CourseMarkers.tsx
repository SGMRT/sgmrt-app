import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { Course } from "@/src/types/course";
import { getTopCoordinate } from "@/src/utils/mapUtils";
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
}

export default function CourseMarkers({
    course,
    activeCourse,
    onClickCourse,
}: CourseMarkersProps) {
    return (
        <View>
            <MarkerView
                id={`marker-view-${course.id}`}
                coordinate={getTopCoordinate(course.coordinates)}
                anchor={{ x: 0.5, y: 0.7 }}
            >
                <CourseTitle course={course} onClickCourse={onClickCourse} />
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
                id={`start-point-source-${course.id}`}
                shape={{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: course.coordinates[0],
                    },
                    properties: {},
                }}
            >
                <CircleLayer
                    id={`start-point-layer-${course.id}`}
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
