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
import { Image as RNImage, View } from "react-native";

import { Puck } from "@/assets/icons/icons";
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
                        <RNImage source={Puck} />
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
                    minZoomLevel={14}
                    maxZoomLevel={18}
                    followZoomLevel={16}
                    animationDuration={0}
                    followUserLocation={isFollowing}
                    followUserMode={followUserMode}
                />
                {children}
                <Viewport onStatusChanged={onStatusChanged} />
                <LocationPuck visible={true} topImage="puck" />
            </MapView>
            <ControlPannel
                onClickCompass={onClickCompass}
                onClickLocateMe={hasLocateMe ? onClickLocateMe : undefined}
            />
        </View>
    );
}
