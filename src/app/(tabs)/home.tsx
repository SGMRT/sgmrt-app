import {
    CircleLayer,
    LineLayer,
    MarkerView,
    setTelemetryEnabled,
    ShapeSource,
    UserTrackingMode,
} from "@rnmapbox/maps";
import axios from "axios";
import Constants from "expo-constants";
import * as ExpoLocation from "expo-location";
import { Pressable, Image as RNImage, StyleSheet, View } from "react-native";

import ControlPannel from "@/src/components/map/ControlPannel";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { Typography } from "@/src/components/ui/Typography";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { Course } from "@/src/types/course";
import { getTopCoordinate } from "@/src/utils/mapUtils";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";

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
                    <Typography variant="subhead3" color="white">
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
                            <Typography variant="body2" color="gray40">
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
    const [isLoading, setIsLoading] = useState(false);
    const { coords, address, temperature, lastUpdated, setLocationInfo } =
        useLocationInfoStore();

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

    const getLocationInfo = async ({
        longitude,
        latitude,
    }: {
        longitude: number;
        latitude: number;
    }) => {
        if (isLoading) return;
        if (lastUpdated && lastUpdated.getTime() + 1000 * 60 * 5 > Date.now()) {
            return;
        }

        setIsLoading(true);

        const address = await ExpoLocation.reverseGeocodeAsync({
            latitude,
            longitude,
        });

        const temperature = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OWM_TOKEN}`
        );

        setLocationInfo(
            [longitude, latitude],
            address[0].district ||
                address[0].city ||
                address[0].region ||
                address[0].country ||
                "--",
            temperature.data.main.temp
        );
        setIsLoading(false);
    };

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
        <View style={styles.container}>
            <LinearGradient
                colors={["rgba(0, 0, 0, 1)", "transparent"]}
                style={styles.headerContainer}
            >
                <View style={styles.weatherInfoContainer}>
                    <Typography variant="subhead2" color="gray40">
                        {address}
                        {temperature ? `${Math.round(temperature)}°` : "--°"}
                    </Typography>
                </View>
                <View style={styles.filterContainer}>
                    <Pressable>
                        <Typography variant="subhead2" color="gray60">
                            필터
                        </Typography>
                    </Pressable>
                    <Pressable>
                        <Typography variant="subhead2" color="primary">
                            고스트 코스
                        </Typography>
                    </Pressable>
                    <Pressable>
                        <Typography variant="subhead2" color="gray60">
                            내 코스
                        </Typography>
                    </Pressable>
                </View>
            </LinearGradient>
            <MapViewWrapper
                isFollowing={isFollowing}
                followUserMode={followUserMode}
                onStatusChanged={onStatusChanged}
                getLocationInfo={getLocationInfo}
            >
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
            </MapViewWrapper>
            <ControlPannel
                onClickCompass={onClickCompass}
                onClickLocateMe={onClickLocateMe}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
    headerContainer: {
        paddingTop: Constants.statusBarHeight,
        position: "absolute",
        backdropFilter: "blur(1px)",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    weatherInfoContainer: {
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    filterContainer: {
        paddingTop: 10,
        paddingHorizontal: 17,
        flexDirection: "row",
        gap: 20,
    },
});
