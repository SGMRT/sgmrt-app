import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";

export default function RunningLine({
    index,
    segment,
}: {
    index: number;
    segment: {
        isRunning: boolean;
        points: {
            longitude: number;
            latitude: number;
        }[];
    };
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
