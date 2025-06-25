import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";

export interface Segment {
    isRunning: boolean;
    points: {
        longitude: number;
        latitude: number;
    }[];
}

export default function RunningLine({
    index,
    segment,
}: {
    index: number;
    segment: Segment;
}) {
    return (
        <ShapeSource
            key={index.toString()}
            id={`segment-${index}`}
            shape={{
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: segment.points.map((point) => [
                        point.longitude,
                        point.latitude,
                    ]),
                },
                properties: {},
            }}
        >
            <LineLayer
                id={`segment-${index}`}
                style={
                    segment.isRunning
                        ? mapboxStyles.activeLineLayer
                        : mapboxStyles.inactiveLineLayer
                }
            />
        </ShapeSource>
    );
}
