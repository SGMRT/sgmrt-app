import { useLocationInfoStore } from "@/src/store/locationInfo";
import { getDistance } from "@/src/utils/mapUtils";
import axios from "axios";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

export default function TopWeatherInfo() {
    const [isLoading, setIsLoading] = useState(false);
    const { coords, address, temperature, lastUpdated, setLocationInfo } =
        useLocationInfoStore();

    const getLocationInfo = useCallback(
        async ({
            longitude,
            latitude,
        }: {
            longitude: number;
            latitude: number;
        }) => {
            if (isLoading) return;
            setIsLoading(true);

            console.log("getLocationInfo");

            if (
                lastUpdated &&
                lastUpdated.getTime() + 1000 * 60 * 60 > Date.now() &&
                getDistance([longitude, latitude], [coords[0]!, coords[1]!]) <
                    1000 &&
                coords[0] &&
                coords[1]
            ) {
                console.log("skip");
                setIsLoading(false);
                return;
            }

            const [address, temperature] = await Promise.all([
                Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                }),
                axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OWM_TOKEN}`
                ),
            ]);

            setLocationInfo(
                [longitude, latitude],
                address[0].district ||
                    address[0].city ||
                    address[0].region ||
                    address[0].country ||
                    "--",
                temperature.data.main.temp
            );
            console.log(address[0], temperature.data.main.temp);
            setIsLoading(false);
            return;
        },
        [setLocationInfo, coords, lastUpdated, isLoading]
    );

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        (async () => {
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: 5,
                    timeInterval: 1000,
                    distanceInterval: 10,
                },
                (location) => {
                    getLocationInfo({
                        longitude: location.coords.longitude,
                        latitude: location.coords.latitude,
                    });
                }
            );
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [getLocationInfo]);

    return (
        <BlurView intensity={4} style={styles.headerContainer}>
            <LinearGradient
                colors={["rgba(0, 0, 0, 1)", "rgba(31, 31, 31, 0)"]}
                style={{ flex: 1, paddingTop: Constants.statusBarHeight }}
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
        </BlurView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
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
