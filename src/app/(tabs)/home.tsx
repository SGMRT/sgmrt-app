import { Compass, LocateMe, Puck } from "@/assets/svgs/svgs";
import {
    Camera,
    CircleLayer,
    Image,
    Images,
    LineLayer,
    LocationPuck,
    MapView,
    MarkerView,
    setTelemetryEnabled,
    ShapeSource,
    StyleImport,
    UserLocation,
    UserTrackingMode,
    Viewport,
} from "@rnmapbox/maps";

import Constants from "expo-constants";
import {
    Pressable,
    Image as RNImage,
    TouchableOpacity,
    View,
} from "react-native";

import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { getTopCoordinate } from "@/src/utils/mapUtils";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";

interface Course {
    id: number;
    name: string;
    count: number;
    topUsers: { userId: number; username: string; profileImage: string }[];
    coordinates: [number, number][];
}

const CourseInformation = ({
    course,
    onClickCourse,
}: {
    course: Course;
    onClickCourse: (course: Course) => void;
}) => {
    const userCountWithoutTopUsers = course.count - course.topUsers.length;

    return (
        <Pressable onPress={() => onClickCourse(course)}>
            <View style={{ gap: 10, alignItems: "center" }}>
                <View
                    style={{
                        backgroundColor: "rgba(63, 63, 63, 0.8)",
                        height: 33,
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        borderRadius: 5,
                    }}
                >
                    <Typography
                        variant="subhead3"
                        style={{ color: colors.white }}
                    >
                        {course.name}
                    </Typography>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {course.topUsers.map((user, index) => (
                        <RNImage
                            key={user.userId}
                            source={{ uri: user.profileImage }}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 100,
                                marginLeft: index === 0 ? 0 : -14,
                                backgroundColor: "white",
                                boxShadow:
                                    "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
                            }}
                        />
                    ))}
                    {userCountWithoutTopUsers > 0 && (
                        <View
                            style={{
                                backgroundColor: "rgba(63, 63, 63, 0.8)",
                                borderRadius: 100,
                                width: 40,
                                height: 40,
                                marginLeft: -14,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Typography
                                variant="body2"
                                style={{
                                    color: colors.gray[40],
                                }}
                            >
                                +{userCountWithoutTopUsers}
                            </Typography>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

export default function Home() {
    const [isFollowing, setIsFollowing] = useState(true);
    const [followUserMode, setFollowUserMode] = useState(
        UserTrackingMode.Follow
    );
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<number>(0);

    const onClickCourse = (course: Course) => {
        setActiveCourse(course.id);
        // TODO: 모달 띄우기
    };

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
                    topUsers: [
                        {
                            userId: 1,
                            username: "user1",
                            profileImage: "https://via.placeholder.com/150",
                        },
                        {
                            userId: 2,
                            username: "user2",
                            profileImage: "https://via.placeholder.com/150",
                        },
                    ],
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

    useEffect(() => {
        setTelemetryEnabled(false);
    }, []);

    const onClickLocateMe = () => {
        setIsFollowing(!isFollowing);
    };

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

    return (
        <View style={{ flex: 1, position: "relative" }}>
            <LinearGradient
                colors={["rgba(0, 0, 0, 1)", "transparent"]}
                style={{
                    paddingTop: Constants.statusBarHeight,
                    position: "absolute",
                    backdropFilter: "blur(1px)",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                }}
            >
                <View
                    style={{
                        height: 50,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        variant="subhead2"
                        style={{ color: colors.gray[40] }}
                    >
                        무거동 21°
                    </Typography>
                </View>
                <View
                    style={{
                        paddingTop: 10,
                        paddingHorizontal: 17,
                        flexDirection: "row",
                        gap: 20,
                    }}
                >
                    <Pressable>
                        <Typography
                            variant="subhead2"
                            style={{
                                color: colors.gray[60],
                            }}
                        >
                            필터
                        </Typography>
                    </Pressable>
                    <Pressable>
                        <Typography
                            variant="subhead2"
                            style={{
                                color: colors.primary,
                            }}
                        >
                            고스트 코스
                        </Typography>
                    </Pressable>
                    <Pressable>
                        <Typography
                            variant="subhead2"
                            style={{
                                color: colors.gray[60],
                            }}
                        >
                            내 코스
                        </Typography>
                    </Pressable>
                </View>
            </LinearGradient>
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
                <UserLocation visible={false} />
                {courses.map((course) => (
                    <View key={course.id}>
                        <MarkerView
                            id={`marker-view-${course.id}`}
                            coordinate={getTopCoordinate(course.coordinates)}
                            anchor={{ x: 0.5, y: 0.7 }}
                        >
                            <CourseInformation
                                course={course}
                                onClickCourse={onClickCourse}
                            />
                        </MarkerView>
                        <ShapeSource
                            onPress={() => onClickCourse(course)}
                            id={`line-source-${course.id}`}
                            lineMetrics={1 as any}
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
                                        ? mapboxStyles.activeLineLayer
                                        : mapboxStyles.inactiveLineLayer
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
                                properties: {},
                            }}
                        >
                            <CircleLayer
                                id={`start-point-layer-${course.id}`}
                                style={
                                    activeCourse === course.id
                                        ? mapboxStyles.activeCircle
                                        : mapboxStyles.inactiveCircle
                                }
                            />
                        </ShapeSource>
                    </View>
                ))}
            </MapView>
            <View
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: 17,
                    gap: 8,
                }}
            >
                <TouchableOpacity
                    style={{
                        backgroundColor: "rgba(17, 17, 17, 0.8)",
                        borderRadius: 100,
                        width: 48,
                        height: 48,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onPress={onClickCompass}
                >
                    <Compass />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: "rgba(17, 17, 17, 0.8)",
                        borderRadius: 100,
                        width: 48,
                        height: 48,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onPress={onClickLocateMe}
                >
                    <LocateMe />
                </TouchableOpacity>
            </View>
        </View>
    );
}
