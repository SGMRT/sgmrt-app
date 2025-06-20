import { Puck } from "@/assets/svgs/svgs";
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
import { useState } from "react";
import { View } from "react-native";
import ControlPannel from "./ControlPannel";

interface MapViewWrapperProps {
    children?: React.ReactNode;
    hasLocateMe?: boolean;
}

export default function MapViewWrapper({
    children,
    hasLocateMe = true,
}: MapViewWrapperProps) {
    const [isFollowing, setIsFollowing] = useState(true);
    const [followUserMode, setFollowUserMode] = useState(
        UserTrackingMode.Follow
    );

    const onStatusChanged = (status: any) => {
        if (status.to.kind === "idle") {
            setIsFollowing(false);
            setFollowUserMode(UserTrackingMode.Follow);
        }
    };

    const onClickCompass = () => {
        if (!isFollowing) {
            onClickLocateMe();
        }
        setFollowUserMode(
            followUserMode === UserTrackingMode.Follow
                ? UserTrackingMode.FollowWithHeading
                : UserTrackingMode.Follow
        );
    };

    const onClickLocateMe = () => {
        setIsFollowing(!isFollowing);
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ flex: 1 }}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionPosition={{ bottom: 20, left: 20 }}
                attributionEnabled={false}
                styleURL="mapbox://styles/sgmrt/cmbx0w1xy002701sod2z821zr"
            >
                <Images>
                    <Image name="puck">
                        <Puck />
                    </Image>
                </Images>
                <StyleImport
                    id="basemap"
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: false,
                        showRoadLabels: false,
                        showPointOfInterestLabels: true,
                        showTransitLabels: true,
                        show3dObjects: true,
                    }}
                    existing={true}
                />
                <Camera
                    minZoomLevel={14}
                    maxZoomLevel={18}
                    followZoomLevel={16}
                    animationDuration={0}
                    followUserLocation={isFollowing}
                    followUserMode={followUserMode}
                />
                <Viewport onStatusChanged={onStatusChanged} />
                <LocationPuck visible={true} topImage="puck" />
                {children}
            </MapView>
            <ControlPannel
                onClickCompass={onClickCompass}
                onClickLocateMe={hasLocateMe ? onClickLocateMe : undefined}
            />
        </View>
    );
}
