import { Typography } from "@/src/components/ui";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { devLog } from "@/src/utils/devLog";
import axios from "axios";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
    GEOCODE_BACKOFF_MS,
    needAddressUpdate,
    needWeatherUpdate,
} from "./weatherInfoPolicy";

export default function WeatherInfo() {
    const isLoadingRef = useRef(false);
    // 지오코딩 실패 후 재시도 억제 마감 시각 (rate-limit 재호출 증폭 방지)
    const geocodeBackoffUntilRef = useRef(0);
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
                : null;
            const shouldUpdateWeather = needWeatherUpdate(now, weatherTime);

            // 주소 업데이트 필요 여부 (3km 이동 && backoff 아님)
            const shouldUpdateAddress = needAddressUpdate({
                now,
                current: currentCoord,
                stored: coords,
                backoffUntil: geocodeBackoffUntilRef.current,
            });

            // 둘 다 필요 없으면 스킵
            if (!shouldUpdateWeather && !shouldUpdateAddress) {
                return;
            }

            isLoadingRef.current = true;

            try {
                // 주소 업데이트 (3km 이상 이동 시)
                if (shouldUpdateAddress) {
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
                            geocodeBackoffUntilRef.current = 0;
                        }
                    } catch (e) {
                        // rate-limit 등 실패 시 backoff — 매 위치 업데이트마다
                        // 지오코딩을 재호출하는 증폭을 차단 (마지막 주소는 persist로 유지)
                        geocodeBackoffUntilRef.current =
                            now + GEOCODE_BACKOFF_MS;
                        devLog("주소 요청 실패", e);
                    }
                }

                // 날씨 업데이트 (1시간 경과 시)
                if (shouldUpdateWeather) {
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
