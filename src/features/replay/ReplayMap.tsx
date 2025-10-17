import { GhostIcon } from "@/assets/svgs/svgs";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import {
    Camera,
    LineLayer,
    RasterDemSource,
    ShapeSource,
    StyleImport,
    SymbolLayer,
    Terrain,
} from "@rnmapbox/maps";
import { Link } from "expo-router";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { Sample } from "./hooks/useReplay";
import { buildActiveGradient } from "./utils/gradient";

type Props = {
    data: Sample[];
    lng: number;
    lat: number;
    progress: number;
    heading?: number;
    cameraRef?: React.RefObject<Camera | null>;
};

const CAM_ANIM = 1000;

export default function ReplayMap({
    data,
    lng,
    lat,
    progress,
    heading = 0,
    cameraRef,
}: Props) {
    const routeFC = useMemo(
        () => ({
            type: "FeatureCollection" as const,
            features: [
                {
                    type: "Feature" as const,
                    properties: {},
                    geometry: {
                        type: "LineString" as const,
                        coordinates: data.map((d) => [d.x, d.y]),
                    },
                },
            ],
        }),
        [data]
    );

    const activeGradient = buildActiveGradient(progress, colors.primary);

    useEffect(() => {
        if (!cameraRef?.current) return;
        cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 16,
            pitch: 65,
            heading,
            animationDuration: CAM_ANIM,
        });
    }, [lng, lat, heading, cameraRef]);

    return (
        <View style={{ width: "100%", aspectRatio: 0.75 }}>
            <MapViewWrapper
                showPuck={false}
                controlEnabled={false}
                center={{ latitude: lat, longitude: lng }}
                cameraRef={cameraRef}
                zoom={16}
                attributionEnabled={false}
            >
                <StyleImport
                    id="basemap"
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: false as any,
                        showRoadLabels: false as any,
                        showPointOfInterestLabels: false as any,
                        showTransitLabels: false as any,
                    }}
                    existing={true}
                />
                <RasterDemSource
                    id="dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                />

                <Terrain sourceID="dem" style={{ exaggeration: 1.4 }} />

                {data.length >= 2 && (
                    <>
                        <ShapeSource
                            id="route"
                            shape={routeFC}
                            lineMetrics={1 as any}
                        >
                            <LineLayer
                                id="route-inactive"
                                style={mapboxStyles.inactiveLineLayer}
                                aboveLayerID="z-index-1"
                            />
                            <LineLayer
                                id="route-active"
                                style={{
                                    ...mapboxStyles.activeLineLayer,
                                    lineGradient: activeGradient,
                                }}
                                aboveLayerID="z-index-2"
                            />
                        </ShapeSource>

                        <ShapeSource
                            id="ghost"
                            shape={{
                                type: "Feature",
                                properties: { heading },
                                geometry: {
                                    type: "Point",
                                    coordinates: [lng, lat],
                                },
                            }}
                        >
                            <SymbolLayer
                                id="ghost-puck-layer"
                                style={{
                                    iconImage: "puck",
                                    iconAllowOverlap: true,
                                }}
                                aboveLayerID="z-index-3"
                            />
                        </ShapeSource>
                    </>
                )}
            </MapViewWrapper>
            <GhostIcon width={24} height={24} style={styles.ghostIcon} />
            <Typography
                variant="caption1"
                color="gray40"
                style={styles.attribution}
            >
                <Link href="https://www.mapbox.com/">© Mapbox</Link>{" "}
                <Link href="https://www.openstreetmap.org/copyright">
                    © OpenStreetMap
                </Link>
            </Typography>
        </View>
    );
}

const styles = StyleSheet.create({
    ghostIcon: {
        position: "absolute",
        top: 10,
        left: 10,
    },
    attribution: {
        position: "absolute",
        bottom: 10,
        right: 10,
    },
});
