import { Puck } from "@/assets/svgs/svgs";
import {
    Camera,
    Image,
    Images,
    LocationPuck,
    MapView,
    StyleImport,
    UserLocation,
    UserTrackingMode,
    Viewport,
} from "@rnmapbox/maps";

interface MapViewWrapperProps {
    children: React.ReactNode;
    isFollowing: boolean;
    followUserMode: UserTrackingMode;
    onStatusChanged: (status: any) => void;
    getLocationInfo: (location: {
        longitude: number;
        latitude: number;
    }) => void;
}

export default function MapViewWrapper({
    children,
    isFollowing,
    followUserMode,
    onStatusChanged,
    getLocationInfo,
}: MapViewWrapperProps) {
    return (
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
            <UserLocation
                visible={false}
                onUpdate={(location) => {
                    getLocationInfo({
                        longitude: location.coords.longitude,
                        latitude: location.coords.latitude,
                    });
                }}
            />
            {children}
        </MapView>
    );
}
