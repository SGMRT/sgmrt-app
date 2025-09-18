import {
    Camera,
    CircleLayer,
    Image,
    Images,
    LocationPuck,
    MapView,
    ShapeSource,
    StyleImport,
    UserTrackingMode,
    Viewport,
} from "@rnmapbox/maps";
import { useCallback, useState } from "react";
import { Image as RNImage, StyleSheet, View } from "react-native";

import { Bearing, Puck2, Puck3 } from "@/assets/icons/icons";
import colors from "@/src/theme/colors";
import ControlPannel from "./ControlPannel";

type TrackPhase = "idle" | "follow" | "heading";

interface MapViewWrapperProps {
    children?: React.ReactNode;
    onZoomLevelChanged?: (zoomLevel: number) => void;
    controlPannelPosition?: any;
    controlEnabled?: boolean;
    center?: {
        latitude: number;
        longitude: number;
    };
    zoom?: number;
    showPuck?: boolean;
    onRegionDidChange?: (event: any) => void;
    ref?: React.RefObject<MapView | null>;
    cameraRef?: React.RefObject<Camera | null>;
    logoEnabled?: boolean;
    logoPosition?: any;
    attributionEnabled?: boolean;
    attributionPosition?: any;
}

export default function MapViewWrapper({
    children,
    onZoomLevelChanged,
    controlPannelPosition,
    controlEnabled = true,
    center,
    zoom = 12,
    showPuck = true,
    onRegionDidChange,
    ref,
    cameraRef,
    logoEnabled = true,
    logoPosition = { bottom: 10, left: 10 },
    attributionEnabled = true,
    attributionPosition = { bottom: 8, right: 0 },
}: MapViewWrapperProps) {
    const [phase, setPhase] = useState<TrackPhase>("follow");
    const [followUserMode, setFollowUserMode] = useState(
        UserTrackingMode.Follow
    );

    const onStatusChanged = (status: any) => {
        if (status?.to?.kind === "idle") {
            setPhase("idle");
            setFollowUserMode(UserTrackingMode.Follow);
        }
    };

    // 단일 버튼 토글: idle → follow → heading → idle
    const onToggleTracking = useCallback(() => {
        setPhase((prev) => {
            if (prev === "idle") {
                setFollowUserMode(UserTrackingMode.Follow);
                return "follow";
            } else if (prev === "follow") {
                setFollowUserMode(UserTrackingMode.FollowWithHeading);
                return "heading";
            } else {
                // prev === "heading"
                setFollowUserMode(UserTrackingMode.Follow);
                return "idle";
            }
        });
    }, []);

    const followEnabled =
        controlEnabled && (phase === "follow" || phase === "heading");

    return (
        <View style={{ flex: 1, position: "relative" }}>
            <MapView
                ref={ref}
                style={{ flex: 1 }}
                scaleBarEnabled={false}
                logoEnabled={logoEnabled}
                logoPosition={logoPosition}
                attributionPosition={attributionPosition}
                attributionEnabled={attributionEnabled}
                styleURL="mapbox://styles/sgmrt/cmbx0w1xy002701sod2z821zr"
                onCameraChanged={(event) => {
                    onZoomLevelChanged?.(event.properties.zoom);
                }}
                scrollEnabled={controlEnabled}
                zoomEnabled={controlEnabled}
                onRegionDidChange={(event) => {
                    onRegionDidChange?.(event);
                }}
            >
                <Images>
                    <Image name="topImage">
                        <View style={styles.topImage} />
                    </Image>
                    <Image name="bearingImage">
                        <RNImage source={Bearing} style={styles.bearing} />
                    </Image>
                    <Image name="puck2">
                        <RNImage source={Puck2} />
                    </Image>
                    <Image name="puck3">
                        <RNImage source={Puck3} />
                    </Image>
                </Images>
                <StyleImport
                    id="basemap"
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: "none",
                        showRoadLabels: "none",
                        showPointOfInterestLabels: "none",
                        showTransitLabels: "none",
                        show3dObjects: "none",
                    }}
                    existing={true}
                />
                <Camera
                    minZoomLevel={12}
                    maxZoomLevel={16}
                    followZoomLevel={zoom}
                    animationDuration={0}
                    followUserLocation={followEnabled}
                    followUserMode={followUserMode}
                    centerCoordinate={
                        center ? [center.longitude, center.latitude] : undefined
                    }
                    zoomLevel={zoom}
                    ref={cameraRef}
                />
                <ShapeSource
                    id="z-index-source"
                    shape={{
                        type: "FeatureCollection",
                        features: [],
                    }}
                >
                    {Array.from({ length: 15 }).map((_, index) =>
                        index === 0 ? (
                            <CircleLayer
                                key={`z-index-${index + 1}`}
                                id={`z-index-${index + 1}`}
                            />
                        ) : (
                            <CircleLayer
                                key={`z-index-${index + 1}`}
                                id={`z-index-${index + 1}`}
                                aboveLayerID={`z-index-${index}`}
                            />
                        )
                    )}
                </ShapeSource>
                {children}
                <Viewport onStatusChanged={onStatusChanged} />
                {showPuck && (
                    <LocationPuck
                        topImage="topImage"
                        bearingImage="bearingImage"
                        puckBearing="heading"
                        puckBearingEnabled={true}
                    />
                )}
            </MapView>
            {controlEnabled && (
                <ControlPannel
                    phase={phase}
                    onToggleTracking={onToggleTracking}
                    controlPannelPosition={controlPannelPosition}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    topImage: {
        width: 18,
        height: 18,
        backgroundColor: colors.primary,
        borderRadius: 999,
    },
    bearing: {
        width: 60,
        height: 60,
    },
});
