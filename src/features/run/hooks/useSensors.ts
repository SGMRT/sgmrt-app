// features/run/app/useSensors.ts
import { devLog } from "@/src/utils/devLog";
import * as Location from "expo-location";
import { Barometer, Pedometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { LOCATION_TASK } from "../constants";
import { sharedSensorStore } from "../store/sensorStore";

export function useSensors(enabled: boolean) {
    const stepSubRef = useRef<ReturnType<
        typeof Pedometer.watchStepCount
    > | null>(null);
    const baroSubRef = useRef<ReturnType<typeof Barometer.addListener> | null>(
        null
    );

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        (async () => {
            // 1) 퍼미션
            const { status: fg } =
                await Location.requestForegroundPermissionsAsync();
            if (fg !== "granted") {
                devLog("[SENSORS] 위치 권한 거부");
                return;
            }

            // 2) 중복 시작 방지
            const already = await Location.hasStartedLocationUpdatesAsync(
                LOCATION_TASK
            ).catch(() => false);
            if (!already) {
                await Location.startLocationUpdatesAsync(LOCATION_TASK, {
                    accuracy: Location.Accuracy.BestForNavigation,
                    deferredUpdatesInterval: 3000,
                    activityType: Location.ActivityType.Fitness,
                    pausesUpdatesAutomatically: false,
                    showsBackgroundLocationIndicator: true, // iOS 가시 표시
                });
                devLog("[SENSORS] Location updates started");
            } else {
                devLog("[SENSORS] Location updates already running");
            }

            // 3) 스토어 초기화 (러닝 시작 시점에만)
            sharedSensorStore.reset?.();

            // 4) Barometer (원시 pressure만 저장)
            baroSubRef.current = Barometer.addListener((res) => {
                if (!mounted) return;
                sharedSensorStore.pushPressure({
                    pressure: res?.pressure ?? 0,
                    timestamp:
                        typeof res?.timestamp === "number"
                            ? res.timestamp
                            : Date.now(),
                });
            });

            // 5) Pedometer (누적 steps 저장)
            stepSubRef.current = Pedometer.watchStepCount((res) => {
                if (!mounted) return;
                sharedSensorStore.pushSteps({
                    steps: res?.steps ?? 0,
                    timestamp: Date.now(),
                });
            });
        })();

        return () => {
            mounted = false;

            // 6) 안전한 정지: 시작되어 있을 때만
            Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
                .then((started) => {
                    if (started) {
                        Location.stopLocationUpdatesAsync(LOCATION_TASK);
                    }
                })
                .catch(() => {});

            stepSubRef.current?.remove();
            baroSubRef.current?.remove();

            // 세션 종료/화면 전환 시 스토어 정리
            sharedSensorStore.reset?.();
            devLog("[SENSORS] Cleaned up");
        };
    }, [enabled]);
}
