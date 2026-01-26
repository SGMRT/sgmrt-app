// features/run/app/useSensors.ts
import { onHeartRate } from "@/modules/expo-watch-module";
import { devLog } from "@/src/utils/devLog";
import * as Location from "expo-location";
import { Barometer, Pedometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { LOCATION_TASK } from "../constants";
import { joinedState } from "../store/joinedState";
import { sharedSensorStore } from "../store/sensorStore";

export function useSensors(enabled: boolean) {
    const stepSubRef = useRef<ReturnType<
        typeof Pedometer.watchStepCount
    > | null>(null);
    const baroSubRef = useRef<ReturnType<typeof Barometer.addListener> | null>(
        null
    );
    const heartRateSubRef = useRef<ReturnType<typeof onHeartRate> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        // 스토어 초기화를 비동기 작업 전에 동기적으로 수행
        // 이전 세션 데이터가 남아있지 않도록 보장
        sharedSensorStore.reset?.();
        joinedState.reset();
        devLog("[SENSORS] Store reset (sync)");

        (async () => {
            // 1) Foreground 위치 권한
            const { status: fg } =
                await Location.requestForegroundPermissionsAsync();
            if (fg !== "granted") {
                devLog("[SENSORS] Foreground 위치 권한 거부");
                return;
            }

            if (!mounted) return;

            // 2) 이전 세션의 좀비 태스크 정리 후 새로 시작
            // Cold Start 시 네이티브는 태스크가 실행 중이라고 기억하지만,
            // JS 콜백은 새 컨텍스트에서 연결되지 않으므로 항상 재시작 필요
            const wasRunning = await Location.hasStartedLocationUpdatesAsync(
                LOCATION_TASK
            ).catch(() => false);

            if (wasRunning) {
                devLog("[SENSORS] 이전 세션 태스크 정리 중...");
                await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(
                    () => {}
                );
            }

            if (!mounted) return;

            try {
                await Location.startLocationUpdatesAsync(LOCATION_TASK, {
                    accuracy: Location.Accuracy.BestForNavigation,
                    deferredUpdatesInterval: 3000,
                    showsBackgroundLocationIndicator: true,
                    foregroundService: {
                        notificationTitle: "러닝 기록 중",
                        notificationBody: "GPS 위치를 추적하고 있습니다",
                    },
                });
                devLog("[SENSORS] Location updates started");
            } catch (err) {
                devLog("[SENSORS] Location updates 시작 실패:", err);
            }

            if (!mounted) return;

            // 3) Barometer (원시 pressure만 저장)
            baroSubRef.current = Barometer.addListener(
                ({ pressure, relativeAltitude }) => {
                    if (!mounted) return;
                    sharedSensorStore.pushPressure({
                        pressure: pressure ?? undefined,
                        timestamp: Date.now(),
                    });
                }
            );

            // 5) Pedometer (누적 steps 저장)
            stepSubRef.current = Pedometer.watchStepCount((res) => {
                if (!mounted) return;
                sharedSensorStore.pushSteps({
                    steps: res?.steps ?? 0,
                    timestamp: Date.now(),
                });
            });
            // 6) Heart Rate (심박수 저장)
            heartRateSubRef.current = onHeartRate((bpm) => {
                if (!mounted) return;
                sharedSensorStore.pushHeartRate({
                    bpm: Math.round(bpm),
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
            heartRateSubRef.current?.remove();

            // 세션 종료/화면 전환 시 스토어 정리
            sharedSensorStore.reset?.();
            joinedState.reset();
            devLog("[SENSORS] Cleaned up");
        };
    }, [enabled]);
}
