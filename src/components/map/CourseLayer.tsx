import { CourseResponse } from "@/src/apis/types/course";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import {
    CircleLayer,
    LineLayer,
    ShapeSource,
    SymbolLayer,
} from "@rnmapbox/maps";
import { memo } from "react";
import { core } from "@/src/design-system/tokens/colors";

interface CourseProps {
    course: CourseResponse;
    isActive: boolean;
    onClickCourse?: (course: CourseResponse) => void;
    displayArrow?: boolean;
}

export default memo(function CourseLayer({
    course,
    isActive,
    onClickCourse,
    displayArrow = false,
}: CourseProps) {
    // 좌표가 없는 코스는 그릴 것이 없다.
    //
    // 예전에는 마지막 점을 telemetries[length - 1] 로 바로 읽었다.
    // 빈 배열이면 그 값이 undefined 라 .lng 에서 터졌고,
    // 코스 하나가 비어 있으면 지도 화면 전체가 오류 화면으로 빠졌다.
    // 서버가 좌표를 아직 돌려주지 않은 코스에서도 이 조건에 걸린다.
    const points = course.telemetries ?? [];
    if (points.length === 0) return null;

    const lastPoint = points[points.length - 1];

    return (
        <>
            <ShapeSource
                onPress={() => onClickCourse?.(course)}
                id={`line-source-${course.id}`}
                lineMetrics={1 as any}
                shape={{
                    type: "Feature",
                    properties: {
                        color: core.white,
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: points.map((telemetry) => [
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

                <SymbolLayer
                    id={`arrow-layer-${course.id}`}
                    aboveLayerID={`line-layer-${course.id}`}
                    style={{
                        symbolPlacement: "line", // 핵심!
                        symbolSpacing: 80,
                        iconImage: displayArrow && isActive ? "arrow-p" : "",
                        iconSize: 0.25,
                        iconAllowOverlap: true,
                        iconIgnorePlacement: true,
                        iconRotationAlignment: "map", // 지도의 각도 기준 회전
                    }}
                />
            </ShapeSource>
            <ShapeSource
                id={`end-point-source-${course.id}`}
                shape={{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [lastPoint.lng, lastPoint.lat],
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
