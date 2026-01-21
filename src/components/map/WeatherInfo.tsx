import { Typography } from "@/src/components/ui";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { devLog } from "@/src/utils/devLog";
import { getDistance } from "@/src/utils/mapUtils";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30분
const DISTANCE_THRESHOLD_M = 1000; // 1km

export default function WeatherInfo() {
    const isLoadingRef = useRef(false);
    const { coords, address, temperature, lastUpdated, setLocationInfo, updateTemperature } =
        useLocationInfoStore();

    const getLocationInfo = useCallback(
        async ({
            longitude,
            latitude,
        }: {
            longitude: number;
            latitude: number;
        }) => {
            if (isLoadingRef.current) return;
            isLoadingRef.current = true;

            try {
                const now = Date.now();
                const lastTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;
                const timeSinceUpdate = now - lastTime;
                const isWithinCacheDuration = timeSinceUpdate < CACHE_DURATION_MS;

                const currentCoord = { lat: latitude, lng: longitude };
                const distance = coords ? getDistance(coords, currentCoord) : Infinity;
                const isWithinDistanceThreshold = distance < DISTANCE_THRESHOLD_M;

                // 30분 이내 + 1km 미만 이동 → 요청 안 함
                if (isWithinCacheDuration && isWithinDistanceThreshold) {
                    devLog("기상 정보 캐시 사용");
                    return;
                }

                // 1km 이상 이동 → 주소 + 날씨 둘 다 요청
                if (!isWithinDistanceThreshold) {
                    devLog("기상 정보 요청 (주소 + 날씨)");

                    const [addressResult, weatherResult] = await Promise.all([
                        Location.reverseGeocodeAsync({ latitude, longitude }),
                        axios.get(
                            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OWM_TOKEN}`
                        ),
                    ]);

                    setLocationInfo(
                        currentCoord,
                        addressResult[0].district ||
                            addressResult[0].city ||
                            addressResult[0].region ||
                            addressResult[0].country ||
                            "--",
                        weatherResult.data.main.temp
                    );
                    return;
                }

                // 1km 미만 + 30분 이상 → 날씨만 요청
                devLog("기상 정보 요청 (날씨만)");
                const weatherResult = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OWM_TOKEN}`
                );
                updateTemperature(weatherResult.data.main.temp);
            } catch (error) {
                devLog("기상 정보 요청 실패", error);
            } finally {
                isLoadingRef.current = false;
            }
        },
        [coords, lastUpdated, setLocationInfo, updateTemperature]
    );

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        (async () => {
            // try catch
            try {
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
            } catch (error) {
                devLog("위치 정보 조회 실패", error);
            }
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
