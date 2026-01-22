import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { ProgressBar, Typography } from "@/src/components/ui";
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
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Sample } from "./types";

type PreviewMapProps = {
    route: Sample[];
    lng: number;
    lat: number;
    heading?: number;
    cameraRef?: React.RefObject<Camera | null>;
    progress: number;
    zoomLevel?: number;
    pitch?: number;
    seekToProgress?: (p: number) => void;
    pause?: () => void;
    play?: () => void;
    controlEnabled?: boolean;
    captureMode?: boolean;
    isReady?: boolean;
};

export default function PreviewMap({
    route,
    lng,
    lat,
    heading = 0,
    cameraRef,
    progress,
    zoomLevel = 15.5,
    pitch = 50,
    seekToProgress,
    pause,
    play,
    controlEnabled = true,
    captureMode = false,
    isReady = false,
}: PreviewMapProps) {
    const mapReadyRef = useRef(false);
    const hasAutoPlayedRef = useRef(false);
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
                        coordinates: route.map((r) => [r.x, r.y]),
                    },
                },
            ],
        };
    }, [route]);

    const tryAutoPlay = useCallback(() => {
        if (isReady && mapReadyRef.current && !hasAutoPlayedRef.current) {
            hasAutoPlayedRef.current = true;
            // 맵 렌더링이 완료될 때까지 잠시 대기
            setTimeout(() => {
                play?.();
            }, 300);
        }
    }, [isReady, play]);

    const onMapReady = useCallback(() => {
        if (!cameraRef?.current || mapReadyRef.current) return;
        mapReadyRef.current = true;

        cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: zoomLevel,
            pitch: pitch,
            heading: heading,
        });

        tryAutoPlay();
    }, [lng, lat, heading, cameraRef, tryAutoPlay]);

    // 맵이 먼저 준비되고 타임라인이 나중에 준비되는 경우
    useEffect(() => {
        tryAutoPlay();
    }, [tryAutoPlay]);

    useEffect(() => {
        if (!cameraRef?.current) return;

        cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: zoomLevel,
            pitch: pitch,
            heading: heading,
            animationDuration: captureMode ? 0 : 500,
        });
    }, [lng, lat, heading, cameraRef]);

    const clamped = Math.max(0.002, Math.min(0.998, progress));

    const gradientExpr = useMemo(
        () =>
            [
                "interpolate",
                ["linear"],
                ["line-progress"],
                0,
                colors.primary,
                clamped - 0.001,
                colors.primary,
                clamped + 0.001,
                "rgba(255,255,255,0.5)",
                1,
                "rgba(255,255,255,0.5)",
            ] as const,
        [clamped, colors.primary]
    );

    return (
        <View style={{ width: "100%", flex: 1 }}>
            <MapViewWrapper
                showPuck={false}
                controlEnabled={false}
                center={initialPosition.current}
                cameraRef={cameraRef}
                zoom={zoomLevel}
                maxZoomLevel={zoomLevel}
                attributionEnabled={false}
                logoPosition={{ top: 10, left: 10 }}
                onRegionDidChange={onMapReady}
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
                {route.length >= 2 && (
                    <>
                        <ShapeSource
                            id="route"
                            shape={routeFC}
                            lineMetrics={1 as any}
                        >
                            <LineLayer
                                id="route-inactive"
                                style={{
                                    ...mapboxStyles.inactiveLineLayer,
                                    lineGradient: gradientExpr as any,
                                    lineOpacity: 1,
                                }}
                                aboveLayerID="z-index-1"
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
            {controlEnabled && (
                <View
                    style={{
                        position: "absolute",
                        bottom: 18,
                        left: 18,
                        right: 18,
                    }}
                >
                    <ProgressBar
                        progress={Math.max(0, Math.min(1, progress))}
                        backgroundColor={colors.gray[60]}
                        duration={0.5}
                        controller={true}
                        onChange={(p) => {
                            pause?.();
                            seekToProgress?.(p);
                        }}
                        onCommit={(p) => {
                            seekToProgress?.(p);
                            play?.();
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    attribution: {
        position: "absolute",
        top: 10,
        right: 10,
    },
});
