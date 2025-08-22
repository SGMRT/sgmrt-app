import colors from "@/src/theme/colors";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";
import { memo, useMemo, useRef } from "react";

export interface Segment {
    isRunning: boolean;
    points: { longitude: number; latitude: number }[];
}

type Props = {
    id: string;
    segment: Segment;
    color?: "red" | "green";
    aboveLayerID?: string;
    belowLayerID?: string;
};

function RunningLineImpl({
    id,
    segment,
    color = "green",
    aboveLayerID,
    belowLayerID,
}: Props) {
    // 소스/레이어 ID는 한 번만 정해져야 함(재마운트 방지)
    const sourceIdRef = useRef(`src-${id}`);
    const layerIdRef = useRef(`layer-${id}`);

    const last = segment.points[segment.points.length - 1];

    // 좌표 메모: 길이나 "마지막 점"이 바뀔 때만 재계산
    const coordinates = useMemo(
        () =>
            segment.points.map(
                (p) => [p.longitude, p.latitude] as [number, number]
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [segment.points.length, last?.longitude, last?.latitude]
    );

    const feature = useMemo(
        () => ({
            type: "Feature" as const,
            geometry: { type: "LineString" as const, coordinates },
            properties: {},
        }),
        [coordinates]
    );

    const style = useMemo(() => {
        const base = segment.isRunning
            ? mapboxStyles.activeLineLayer
            : mapboxStyles.inactiveLineLayer;
        if (segment.isRunning && color === "red") {
            return { ...base, lineColor: colors.red };
        }
        return base;
    }, [segment.isRunning, color]);

    return (
        <ShapeSource id={sourceIdRef.current} shape={feature}>
            <LineLayer
                id={layerIdRef.current}
                style={style}
                aboveLayerID={aboveLayerID}
                belowLayerID={belowLayerID}
            />
        </ShapeSource>
    );
}

// 불필요 리렌더 차단: 상태/색/길이/마지막점만 비교
export default memo(RunningLineImpl, (prev, next) => {
    if (prev.color !== next.color) return false;
    if (prev.segment.isRunning !== next.segment.isRunning) return false;
    if (prev.segment.points.length !== next.segment.points.length) return false;
    const a = prev.segment.points.at(-1);
    const b = next.segment.points.at(-1);
    if (!a && !b) return true;
    return a?.latitude === b?.latitude && a?.longitude === b?.longitude;
});
