import {
    queryWorkoutSamples,
    WorkoutActivityType,
    WorkoutSample,
} from "@kingstinct/react-native-healthkit";
import { SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Test() {
    const [workouts, setWorkouts] = useState<WorkoutSample[]>([]);

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});

        (async () => {
            const workoutsRaw = await queryWorkoutSamples({
                limit: 50,
                ascending: false,
            });

            const filtered = workoutsRaw.filter(
                (w) =>
                    w.sourceRevision?.source?.bundleIdentifier ==
                        "com.sgmrt.ghostrunner" && w.device?.model === "Watch"
            );

            console.log(filtered[0]);

            filtered[0]
                .getWorkoutRoutes()
                .then((routes) => {
                    console.log(
                        "getWorkoutRoutes",
                        routes.map((r) => r.locations.map((l) => l.latitude))
                    );
                })
                .catch((error) => {
                    console.error("getWorkoutRoutes error", error);
                });

            setWorkouts(filtered);
        })();
    }, []);

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "black",
                paddingHorizontal: 16.5,
            }}
        >
            <ScrollView>
                <Text style={{ color: "white", marginBottom: 8, fontSize: 18 }}>
                    Apple Fitness → HealthKit Workout 가져오기 테스트
                </Text>
                {workouts.map((w) => (
                    <Text
                        key={w.uuid}
                        style={{ color: "white", marginBottom: 4 }}
                    >
                        • {WorkoutActivityType[w.workoutActivityType]} /{" "}
                        {w.duration.quantity.toFixed(0)}초 /{" "}
                    </Text>
                ))}
                {!workouts.length && (
                    <Text style={{ color: "gray" }}>
                        최근 30일 운동 데이터가 없거나, 권한이 없을 수 있어.
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
