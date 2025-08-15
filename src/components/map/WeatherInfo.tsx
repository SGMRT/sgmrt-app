import { useLocationInfoStore } from "@/src/store/locationInfo";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

export default function WeatherInfo() {
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

            if (
                lastUpdated &&
                coords &&
                new Date(lastUpdated).getTime() + 1000 * 60 * 60 > Date.now()
            ) {
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

            console.log("WeatherInfo", address, temperature);

            setLocationInfo(
                { lng: longitude, lat: latitude },
                address[0].district ||
                    address[0].city ||
                    address[0].region ||
                    address[0].country ||
                    "--",
                temperature.data.main.temp
            );
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
                    timeInterval: 1000 * 60 * 10,
                    distanceInterval: 500,
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
        <View style={styles.weatherInfoContainer}>
            <Typography variant="subhead2" color="gray40">
                {address}
                {temperature ? ` ${Math.round(temperature)}°` : " --°"}
            </Typography>
        </View>
    );
}

const styles = StyleSheet.create({
    weatherInfoContainer: {
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
});
