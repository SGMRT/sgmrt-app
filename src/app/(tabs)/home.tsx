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

interface Course {
    id: number;
    name: string;
    count: number;
    topUsers: { userId: number; username: string; profileImage: string }[];
    coordinates: [number, number][];
}

export default function Home() {
    const [isFollowing, setIsFollowing] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<number>(0);

    const makeCircularCourse = (
        lon: number,
        lat: number,
        length: number
    ): [number, number][] => {
        return Array.from({ length }, (_, i) => {
            const pi = (2 * Math.PI * i) / length;
            const radius = 0.001;
            const newLon = lon + radius * Math.cos(pi);
            const newLat = lat + radius * Math.sin(pi);
            return [newLon, newLat] as [number, number];
        });
    };

    useEffect(() => {
        for (let i = 0; i < 3; i++) {
            setCourses((prev) => [
                ...prev,
                {
                    id: i,
                    name: `course${i}`,
                    count: 49,
                    topUsers: [],
                    coordinates: makeCircularCourse(
                        126.9503078182 + Math.random() * 0.005 * i,
                        37.5439468182 + Math.random() * 0.005 * i,
                        90
                    ),
                },
            ]);
        }

        console.log(courses);
    }, []);

    const styles = {
        activeLineLayer: {
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
        inactiveLineLayer: {
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
                "#ffffff",
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
                {courses.map((course) => (
                    <View key={course.id}>
                        <ShapeSource
                            onPress={() => {
                                setActiveCourse(course.id);
                            }}
                            id={`line-source-${course.id}`}
                            lineMetrics={1}
                            shape={{
                                type: "Feature",
                                properties: {
                                    color: "#ffffff",
                                },
                                geometry: {
                                    type: "LineString",
                                    coordinates: course.coordinates,
                                },
                            }}
                        >
                            <LineLayer
                                id={`line-layer-${course.id}`}
                                style={
                                    activeCourse === course.id
                                        ? styles.activeLineLayer
                                        : styles.inactiveLineLayer
                                }
                            />
                        </ShapeSource>
                        <ShapeSource
                            id={`start-point-source-${course.id}`}
                            shape={{
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: course.coordinates[0],
                                },
                            }}
                        >
                            <CircleLayer
                                id={`start-point-layer-${course.id}`}
                                style={styles.startCircle}
                            />
                        </ShapeSource>
                    </View>
                ))}
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
