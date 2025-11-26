import RunShot, { RunShotHandle } from "@/src/components/share/RunShot";
import { Button } from "@/src/components/ui/Button";
import Header from "@/src/components/ui/Header";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import StatRow from "@/src/components/ui/StatRow";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import {
    formatDistanceKm,
    paceFromKmh,
    round,
    wait,
    workoutRouteRawData,
    workoutRouteTelemetry,
} from "@/src/features/workoutSync/utils";
import { localWorkoutSyncStore } from "@/src/store/workoutSyncStore";
import colors from "@/src/theme/colors";
import {
    getFormattedPace,
    getRunTime,
    saveRunning,
    SaveRunningProps,
} from "@/src/utils/runUtils";
import { queryWorkoutSamples } from "@kingstinct/react-native-healthkit";
import { SplashScreen, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutData = SaveRunningProps & {
    workoutId: string;
};

const WAIT_BEFORE_CAPTURE_MS = 2000;

export default function StatsSync() {
    const router = useRouter();
    const runShotRef = useRef<RunShotHandle>(null);
    const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
    const [selectedWorkout, setSelectedWorkout] = useState<WorkoutData | null>(
        null
    );
    const [isSyncing, setIsSyncing] = useState(false);

    const importedWorkoutIds = localWorkoutSyncStore(
        (s) => s.importedWorkoutIds
    );
    const addImportedId = localWorkoutSyncStore((s) => s.addImportedId);

    const captureMap = useCallback(async () => {
        if (isSyncing) return;
        if (!selectedWorkout) return;
        if (!runShotRef.current) return;
        setIsSyncing(true);
        // 지도 렌더링 여유 시간
        await wait(WAIT_BEFORE_CAPTURE_MS);

        const uri = await runShotRef.current.capture();
        if (!uri) return;

        try {
            const response = await saveRunning({
                ...selectedWorkout,
                thumbnailUri: uri,
            });

            if (response) {
                setSelectedWorkout(null);
                setWorkouts((prev) =>
                    prev.filter(
                        (w) => w.workoutId !== selectedWorkout.workoutId
                    )
                );
                addImportedId(selectedWorkout.workoutId);
                router.replace({
                    pathname:
                        "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                    params: {
                        runningId: response.runningId.toString(),
                        courseId: "-1",
                        ghostRunningId: "-1",
                    },
                });
            }
        } catch (error) {
            showCompactToast("저장에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSyncing(false);
        }
    }, [selectedWorkout, router]);

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});

        const loadWorkouts = async () => {
            try {
                const proxies = await queryWorkoutSamples({
                    limit: 50,
                    ascending: false,
                });

                const filtered = proxies.filter(
                    (p) =>
                        p.sourceRevision?.source?.bundleIdentifier ===
                            "com.sgmrt.ghostrunner" &&
                        p.device?.model === "Watch" &&
                        !importedWorkoutIds.includes(p.uuid)
                );

                const workoutsWithRoutes: WorkoutData[] = await Promise.all(
                    filtered.map(async (proxy) => {
                        const [
                            HeartRate,
                            DistanceWalkingRunning,
                            RunningSpeed,
                            StepCount,
                            Calories,
                        ] = await Promise.all([
                            proxy.getStatistic(
                                "HKQuantityTypeIdentifierHeartRate"
                            ),
                            proxy.getStatistic(
                                "HKQuantityTypeIdentifierDistanceWalkingRunning"
                            ),
                            proxy.getStatistic(
                                "HKQuantityTypeIdentifierRunningSpeed"
                            ),
                            proxy.getStatistic(
                                "HKQuantityTypeIdentifierStepCount"
                            ),
                            proxy.getStatistic(
                                "HKQuantityTypeIdentifierActiveEnergyBurned"
                            ),
                        ]);

                        const routes = await proxy.getWorkoutRoutes();
                        if (!routes.length) return null;

                        const totalTime = proxy.duration?.quantity ?? 0;
                        const totalDistance =
                            DistanceWalkingRunning?.sumQuantity?.quantity ?? 0;
                        if (totalDistance < 0.5) return null;
                        const totalSteps =
                            StepCount?.sumQuantity?.quantity ?? 0;
                        const totalCalories =
                            Calories?.sumQuantity?.quantity ?? 0;

                        const averageHeartRate =
                            HeartRate?.averageQuantity?.quantity ?? 0;
                        const averageSpeedKmh =
                            RunningSpeed?.averageQuantity?.quantity ?? 0;

                        let averagePace = 0;

                        if (averageSpeedKmh > 0) {
                            // 정상적으로 speed가 있을 때
                            averagePace = paceFromKmh(averageSpeedKmh);
                        } else if (totalTime > 0 && totalDistance > 0) {
                            // fallback: 전체 거리와 전체 시간으로 pace를 구한다
                            const hours = totalTime / 3600; // sec → hour
                            const speedFromDistance = totalDistance / hours; // km/h

                            averagePace = paceFromKmh(speedFromDistance);
                        } else {
                            averagePace = 0;
                        }

                        const averageCadence =
                            totalSteps > 0 && totalTime > 0
                                ? (totalSteps / totalTime) * 60
                                : 0;

                        const routesTelemetry = workoutRouteTelemetry(
                            routes[0],
                            averageHeartRate,
                            averageCadence
                        );
                        const rawData = workoutRouteRawData(routes[0]);

                        const workout: WorkoutData = {
                            workoutId: proxy.uuid,
                            telemetries: routesTelemetry.telemetries,
                            rawData,
                            userDashboardData: {
                                totalDistance: round(totalDistance * 1000, 2),
                                totalCalories: round(totalCalories, 0),
                                averagePace: round(averagePace, 0),
                                averageCadence: round(averageCadence, 0),
                                recentPointsPace: round(averagePace, 0),
                                bpm: round(averageHeartRate, 0),
                                totalElevationGain: round(
                                    routesTelemetry.totalElevationGain,
                                    0
                                ),
                                totalElevationLoss: round(
                                    routesTelemetry.totalElevationLoss,
                                    0
                                ),
                            },
                            thumbnailUri: null,
                            runTime: round(totalTime, 0),
                            isPublic: true,
                            saveHealthKit: false,
                        };

                        return workout;
                    })
                ).then((arr) => arr.filter(Boolean) as WorkoutData[]);

                setWorkouts(workoutsWithRoutes);
            } catch (e) {
                console.warn("Failed to load workouts", e);
            }
        };

        loadWorkouts();
    }, []);

    const onConfirmSelection = () => {
        if (!selectedWorkout) {
            Alert.alert("운동 선택", "먼저 운동을 하나 선택해줘.");
            return;
        }
        captureMap();
    };

    return (
        <>
            {isSyncing && <LoadingLayer />}
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: "#111111",
                    paddingHorizontal: 16.5,
                }}
            >
                <Header titleText="고스트러너 워치 운동 데이터 동기화" />
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: 16,
                        paddingBottom: 24,
                    }}
                >
                    {workouts.map((w) => {
                        const isSelected = selectedWorkout === w;
                        const distanceM =
                            w.userDashboardData.totalDistance ?? 0;
                        const km = formatDistanceKm(distanceM);

                        return (
                            <TouchableOpacity
                                key={w.workoutId}
                                onPress={() =>
                                    setSelectedWorkout((prev) =>
                                        prev === w ? null : w
                                    )
                                }
                                style={{
                                    paddingVertical: isSelected ? 9 : 10,
                                    paddingHorizontal: isSelected ? 11 : 12,
                                    marginBottom: 8,
                                    borderRadius: 12,
                                    borderWidth: isSelected ? 2 : 1,
                                    borderColor: isSelected
                                        ? colors.primary
                                        : colors.gray[80],
                                    backgroundColor: isSelected
                                        ? "rgba(226, 255, 0, 0.12)"
                                        : "rgba(255,255,255,0.05)",
                                }}
                            >
                                <Typography
                                    variant="caption1"
                                    color="gray40"
                                    style={{ marginBottom: 2 }}
                                >
                                    {new Date(
                                        w.telemetries?.[0]?.timeStamp
                                    ).toLocaleDateString("ko-KR", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Typography>

                                <StatRow
                                    stats={[
                                        {
                                            value: km.toFixed(2),
                                            unit: "km",
                                            description: "거리",
                                        },
                                        {
                                            value: getRunTime(
                                                w.runTime ?? 0,
                                                "HH:MM:SS_IF_HH_EXISTS"
                                            ),
                                            description: "시간",
                                        },
                                        {
                                            value: getFormattedPace(
                                                w.userDashboardData
                                                    .averagePace ?? 0
                                            ),
                                            description: "페이스",
                                        },
                                        {
                                            value:
                                                w.userDashboardData
                                                    .averageCadence ?? 0,
                                            description: "케이던스",
                                        },
                                    ]}
                                    color="gray20"
                                    style={{ gap: 20 }}
                                />
                            </TouchableOpacity>
                        );
                    })}

                    {!workouts.length && (
                        <View style={{ marginTop: 8 }}>
                            <Typography variant="body3" color="gray40">
                                최근 30일 운동 데이터가 없거나, 권한이 없을 수
                                있습니다.{"\n"}워치에서 고스트러너로 운동을
                                기록한 뒤 다시 확인해 주세요.
                            </Typography>
                        </View>
                    )}
                </ScrollView>

                {workouts.length > 0 && (
                    <Button
                        title="동기화"
                        onPress={onConfirmSelection}
                        type={selectedWorkout ? "active" : "dark-inactive"}
                        style={{
                            marginHorizontal: 0,
                        }}
                    />
                )}
            </SafeAreaView>

            <RunShot
                title={""}
                ref={runShotRef}
                fileName={"runImage.jpg"}
                telemetries={selectedWorkout?.telemetries ?? []}
                type="thumbnail"
            />
        </>
    );
}
