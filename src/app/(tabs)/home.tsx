import { LocateMe } from "@/assets/svgs/svgs";
import {
    Camera,
    CircleLayer,
    Image,
    Images,
    LineLayer,
    LocationPuck,
    MapView,
    setTelemetryEnabled,
    ShapeSource,
    StyleImport,
    UserLocation,
    Viewport,
} from "@rnmapbox/maps";

import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

const circularCourse = Array.from({ length: 100 }, (_, i) => {
    const pi = (2 * Math.PI * i) / 120;
    const radius = 0.002;
    const lon = 126.9502078182 + radius * Math.cos(pi);
    const lat = 37.5439458182 + radius * Math.sin(pi);
    return [lon, lat];
});

export default function Home() {
    const [isFollowing, setIsFollowing] = useState(true);

    const styles = {
        lineLayer: {
            lineCap: "round",
            lineJoin: "round",
            lineWidth: 3,
            lineEmissiveStrength: 1,
            lineGradient: [
                "interpolate",
                ["linear"],
                ["line-progress"], // 선 길이 비율 0~1
                0,
                "#ffffff",
                1,
                "#CFE900",
            ],
        },
        startCircle: {
            circleRadius: 6,
            circleColor: "#ffffff",
            circleEmissiveStrength: 1,
        },
    };

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
                attributionPosition={{ bottom: 20, left: 20 }}
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
                    minZoomLevel={14}
                    maxZoomLevel={18}
                    followZoomLevel={16}
                    animationDuration={0}
                    followUserLocation={isFollowing}
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
                <ShapeSource
                    id="line-source"
                    lineMetrics={1}
                    shape={{
                        type: "Feature",
                        properties: {
                            color: "#ffffff",
                        },
                        geometry: {
                            type: "LineString",
                            coordinates: circularCourse,
                        },
                    }}
                >
                    <LineLayer id="line-layer" style={styles.lineLayer} />
                </ShapeSource>
                {circularCourse.length > 0 && (
                    <ShapeSource
                        id="start-point-source"
                        shape={{
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: circularCourse[0],
                            },
                        }}
                    >
                        <CircleLayer
                            id="start-point-layer"
                            style={styles.startCircle}
                        />
                    </ShapeSource>
                )}
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
