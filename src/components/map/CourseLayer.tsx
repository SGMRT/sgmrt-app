import { CourseResponse } from "@/src/apis/types/course";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { CircleLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { memo } from "react";

interface CourseProps {
    course: CourseResponse;
    isActive: boolean;
    onClickCourse?: (course: CourseResponse) => void;
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
                        coordinates: course.telemetries.map((telemetry) => [
                            telemetry.lng,
                            telemetry.lat,
                        ]),
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
                    aboveLayerID={isActive ? `z-index-5` : `z-index-2`}
                />
            </ShapeSource>
            <ShapeSource
                id={`end-point-source-${course.id}`}
                shape={{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            course.telemetries[course.telemetries.length - 1]
                                .lng,
                            course.telemetries[course.telemetries.length - 1]
                                .lat,
                        ],
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
                    aboveLayerID={isActive ? `z-index-5` : `z-index-2`}
                />
            </ShapeSource>
        </>
    );
});
