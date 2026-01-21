import { Typography } from "@/src/components/ui";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { devLog } from "@/src/utils/devLog";
import { getDistance } from "@/src/utils/mapUtils";
import axios from "axios";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

const WEATHER_CACHE_MS = 60 * 60 * 1000; // 날씨: 1시간
const ADDRESS_DISTANCE_M = 3000; // 주소: 3km 이동 시

export default function WeatherInfo() {
    const isLoadingRef = useRef(false);
    const { address, temperature } = useLocationInfoStore();

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const handleLocationUpdate = async (location: Location.LocationObject) => {
            if (isLoadingRef.current) return;

            const now = Date.now();
            const state = useLocationInfoStore.getState();
            const {
                coords,
                weatherLastUpdated,
                updateAddress,
                updateTemperature,
            } = state;

            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;
            const currentCoord = { lat: latitude, lng: longitude };

            // 날씨 업데이트 필요 여부 (1시간 경과)
            const weatherTime = weatherLastUpdated
                ? new Date(weatherLastUpdated).getTime()
                : 0;
            const needWeatherUpdate = now - weatherTime >= WEATHER_CACHE_MS;

            // 주소 업데이트 필요 여부 (3km 이동)
            const distance = coords ? getDistance(coords, currentCoord) : Infinity;
            const needAddressUpdate = distance >= ADDRESS_DISTANCE_M;

            // 둘 다 필요 없으면 스킵
            if (!needWeatherUpdate && !needAddressUpdate) {
                return;
            }

            isLoadingRef.current = true;

            try {
                // 주소 업데이트 (3km 이상 이동 시)
                if (needAddressUpdate) {
                    devLog("주소 정보 요청");
                    try {
                        const addressResult = await Location.reverseGeocodeAsync({
                            latitude,
                            longitude,
                        });
                        const addr = addressResult?.[0];
                        if (addr) {
                            const place =
                                addr.district ??
                                addr.city ??
                                addr.region ??
                                addr.country ??
                                "--";
                            updateAddress(currentCoord, place);
                        }
                    } catch (e) {
                        devLog("주소 요청 실패", e);
                    }
                }

                // 날씨 업데이트 (1시간 경과 시)
                if (needWeatherUpdate) {
                    devLog("날씨 정보 요청");
                    const weatherResult = await axios.get(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.EXPO_PUBLIC_OWM_TOKEN}`
                    );
                    updateTemperature(weatherResult.data.main.temp);
                }
            } catch (error) {
                devLog("기상 정보 요청 실패", error);
            } finally {
                isLoadingRef.current = false;
            }
        };

        (async () => {
            try {
                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 1000 * 60 * 10, // 10분
                        distanceInterval: 1000, // 1km
                    },
                    handleLocationUpdate
                );
            } catch (error) {
                devLog("위치 정보 조회 실패", error);
            }
        })();

        return () => {
            subscription?.remove();
        };
    }, []);

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
