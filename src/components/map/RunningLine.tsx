import colors from "@/src/theme/colors";
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
    color = "green",
    aboveLayerID,
    belowLayerID,
}: {
    index: number | string;
    segment: Segment;
    color?: "red" | "green";
    aboveLayerID?: string;
    belowLayerID?: string;
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
                        ? color === "green"
                            ? mapboxStyles.activeLineLayer
                            : {
                                  ...mapboxStyles.activeLineLayer,
                                  lineColor: colors.red,
                              }
                        : mapboxStyles.inactiveLineLayer
                }
                aboveLayerID={aboveLayerID}
                belowLayerID={belowLayerID}
            />
        </ShapeSource>
    );
}
