import {
    Camera,
    Image,
    Images,
    LocationPuck,
    MapView,
    StyleImport,
    UserTrackingMode,
    Viewport,
} from "@rnmapbox/maps";
import { useCallback, useState } from "react";
import { Image as RNImage, View } from "react-native";

import { Puck, Puck2, Puck3 } from "@/assets/icons/icons";
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
    zoom = 16,
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
                    <Image name="puck">
                        <RNImage source={Puck} />
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
                    followZoomLevel={16}
                    animationDuration={0}
                    followUserLocation={followEnabled}
                    followUserMode={followUserMode}
                    centerCoordinate={
                        center ? [center.longitude, center.latitude] : undefined
                    }
                    zoomLevel={zoom}
                    ref={cameraRef}
                />
                {children}
                <Viewport onStatusChanged={onStatusChanged} />
                {showPuck && <LocationPuck visible={true} topImage="puck" />}
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
