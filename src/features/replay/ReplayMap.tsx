import { GhostIcon } from "@/assets/svgs/svgs";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { Typography } from "@/src/components/ui/Typography";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { getRunTime } from "@/src/utils/runUtils";
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
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { ReplayStats, Sample } from "./hooks/useReplay";

const CAM_ANIM = 500;
const CAM_PITCH = 40;
const CAM_ZOOM = 16;

type Props = {
    data: Sample[];
    stats: ReplayStats;
    lng: number;
    lat: number;
    progress: number;
    heading?: number;
    cameraRef?: React.RefObject<Camera | null>;
    onMapReady?: () => void;
};

export default function ReplayMap({
    data,
    stats,
    lng,
    lat,
    progress,
    heading = 0,
    cameraRef,
}: Props) {
    const initialPosition = useRef({ latitude: lat, longitude: lng });

    const routeFC = useMemo(() => {
        return {
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
        };
    }, [data]);

    const activeRouteFC = {
        type: "FeatureCollection" as const,
        features: [
            {
                type: "Feature" as const,
                properties: {},
                geometry: {
                    type: "LineString" as const,
                    coordinates: data
                        .slice(0, Math.floor(progress * data.length))
                        .map((d) => [d.x, d.y]),
                },
            },
        ],
    };

    const onMapReady = useCallback(() => {
        if (!cameraRef?.current) return;

        cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: CAM_ZOOM,
            pitch: CAM_PITCH,
            heading: heading,
        });
    }, [lng, lat, heading, cameraRef]);

    useEffect(() => {
        if (!cameraRef?.current) return;

        cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: CAM_ZOOM,
            pitch: CAM_PITCH,
            heading: heading,
            animationDuration: CAM_ANIM,
        });
    }, [lng, lat, heading, cameraRef]);

    return (
        <View style={{ width: "100%", aspectRatio: 0.75 }}>
            <MapViewWrapper
                showPuck={false}
                controlEnabled={false}
                center={initialPosition.current}
                cameraRef={cameraRef}
                zoom={CAM_ZOOM}
                maxZoomLevel={CAM_ZOOM}
                attributionEnabled={false}
                onDidFinishLoadingMap={onMapReady}
            >
                <StyleImport
                    id="basemap"
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: true as any,
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
                        </ShapeSource>

                        <ShapeSource
                            id="route-active"
                            shape={activeRouteFC}
                            lineMetrics={1 as any}
                        >
                            <LineLayer
                                id="route-active"
                                style={mapboxStyles.activeLineLayer}
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
            <View
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    gap: 4,
                    alignItems: "flex-end",
                }}
            >
                <Typography variant="headline" color="gray40">
                    {(stats.distanceM / 1000).toFixed(2)} km
                </Typography>
                {/* <Typography variant="headline" color="gray40">
                    {stats.progress > 0
                        ? getFormattedPace(stats.paceSec)
                        : "0'00''"}
                </Typography> */}
                <Typography variant="headline" color="gray40">
                    {getRunTime(stats.elapsedMs / 1000, "HH:MM:SS")}
                </Typography>
            </View>
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
