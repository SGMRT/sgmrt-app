import { setTelemetryEnabled, UserTrackingMode } from "@rnmapbox/maps";
import axios from "axios";
import * as ExpoLocation from "expo-location";
import { StyleSheet, View } from "react-native";

import ControlPannel from "@/src/components/map/ControlPannel";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import SlideToAction from "@/src/components/map/SlideToAction";
import TopWeatherInfo from "@/src/components/map/TopWeatherInfo";
import TabBar from "@/src/components/ui/TabBar";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { Course } from "@/src/types/course";
import { useEffect, useState } from "react";

export default function Home() {
    const [isFollowing, setIsFollowing] = useState(true);
    const [followUserMode, setFollowUserMode] = useState(
        UserTrackingMode.Follow
    );
    const [courses, setCourses] = useState<Course[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const { address, temperature, lastUpdated, setLocationInfo } =
        useLocationInfoStore();

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
            <TopWeatherInfo address={address} temperature={temperature} />
            <MapViewWrapper
                isFollowing={isFollowing}
                followUserMode={followUserMode}
                onStatusChanged={onStatusChanged}
                getLocationInfo={getLocationInfo}
                courses={courses}
            />
            <ControlPannel
                onClickCompass={onClickCompass}
                onClickLocateMe={onClickLocateMe}
            />
            <TabBar />
            <SlideToAction
                label="밀어서 러닝시작"
                onSlideSuccess={() => {
                    console.log("slide success");
                }}
                color="green"
                direction="left"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});
