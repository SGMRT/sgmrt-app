import { LocateMe } from "@/assets/svgs/svgs";
import {
    Camera,
    Image,
    Images,
    LocationPuck,
    MapView,
    setTelemetryEnabled,
    StyleImport,
    UserLocation,
    Viewport,
} from "@rnmapbox/maps";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

export default function Home() {
    const [isFollowing, setIsFollowing] = useState(true);
    useEffect(() => {
        setTelemetryEnabled(false);
    }, []);

    const moveToUserLocation = () => {
        setIsFollowing(true);
    };

    const onStatusChanged = (status: any) => {
        if (status.to.kind === "idle") {
            setIsFollowing(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ flex: 1 }}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionPosition={{ bottom: 10, left: 10 }}
                styleURL="mapbox://styles/sgmrt/cmbx0w1xy002701sod2z821zr"
            >
                <Images>
                    <Image name="puck">
                        <View
                            style={{
                                borderColor: "white",
                                borderWidth: 3,
                                width: 23,
                                height: 23,
                                borderRadius: 100,
                                backgroundColor: "#cfe900",
                            }}
                        />
                    </Image>
                </Images>
                <StyleImport
                    id="basemap"
                    existing
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: false,
                        showRoadLabels: false,
                        showPointOfInterestLabels: true,
                        showTransitLabels: true,
                        show3dObjects: true,
                    }}
                />
                <Camera
                    zoomLevel={16}
                    animationDuration={0}
                    followUserLocation={isFollowing}
                    minZoomLevel={16}
                    maxZoomLevel={16}
                />
                <Viewport onStatusChanged={onStatusChanged} />
                <LocationPuck
                    visible={true}
                    topImage="puck"
                    pulsing={{
                        isEnabled: true,
                        color: "#cfe900",
                        radius: 22,
                    }}
                />
                <UserLocation visible={false} />
            </MapView>
            <TouchableOpacity
                style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    backgroundColor: "rgba(75, 75, 75, 0.8)",
                    borderRadius: 100,
                    width: 49.53,
                    height: 49.53,
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onPress={moveToUserLocation}
            >
                <LocateMe />
            </TouchableOpacity>
        </View>
    );
}
