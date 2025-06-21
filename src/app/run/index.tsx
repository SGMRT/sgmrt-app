import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import colors from "@/src/theme/colors";
import { mapboxStyles } from "@/src/theme/mapboxStyles";
import { getDistance } from "@/src/utils/mapUtils";
import { getCalories, getPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Run() {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { bottom } = useSafeAreaInsets();
    const [isRunning, setIsRunning] = useState(true);
    const [runTime, setRunTime] = useState(0);
    const [runLine, setRunLine] = useState<[number, number][]>([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [runAltitude, setRunAltitude] = useState<number[]>([]);
    const [runElevationGain, setRunElevationGain] = useState(0);
    const [isPedometerAvailable, setIsPedometerAvailable] =
        useState("checking");
    const [pastStepCount, setPastStepCount] = useState(0);
    const [currentStepCount, setCurrentStepCount] = useState(0);
    const router = useRouter();

    const cadence =
        runTime > 0
            ? Math.round(((currentStepCount - pastStepCount) / runTime) * 60)
            : 0;

    const stats = [
        { label: "거리", value: (totalDistance / 1000).toFixed(2), unit: "km" },
        {
            label: "평균 페이스",
            value: getPace(runTime, totalDistance),
            unit: "",
        },
        { label: "케이던스", value: cadence.toString(), unit: "spm" },
        {
            label: "고도",
            value: runElevationGain.toFixed(0),
            unit: "m",
        },
        {
            label: "칼로리",
            value: getCalories({
                distance: totalDistance,
                timeInSec: runTime,
                weight: 70,
            }).toFixed(0),
            unit: "kcal",
        },
        { label: "BPM", value: "--", unit: "" },
    ];

    const addRunLine = useCallback((coords: [number, number]) => {
        setRunLine((prev) => {
            const newLine = [...prev, coords];

            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dist = getDistance(last, coords);
                if (dist < 100) {
                    setTotalDistance((prevDist) => prevDist + dist);
                }
            }

            return newLine;
        });
    }, []);

    useEffect(() => {
        let subscription: Pedometer.Subscription | null = null;

        const subscribe = async () => {
            const isAvailable = await Pedometer.isAvailableAsync();
            setIsPedometerAvailable(String(isAvailable));

            if (isAvailable) {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 1);

                const pastStepCountResult = await Pedometer.getStepCountAsync(
                    start,
                    end
                );
                if (pastStepCountResult) {
                    setPastStepCount(pastStepCountResult.steps);
                }

                subscription = Pedometer.watchStepCount((result) => {
                    setCurrentStepCount(result.steps);
                });
            }
        };

        subscribe();

        return () => {
            subscription?.remove();
        };
    }, []);

    useEffect(() => {
        bottomSheetRef.current?.present();
    }, []);

    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(() => {
                setRunTime((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        (async () => {
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 10,
                },
                (location) => {
                    addRunLine([
                        location.coords.longitude,
                        location.coords.latitude,
                    ]);
                    setRunElevationGain((prev) => {
                        const lastAltitude =
                            runAltitude[runAltitude.length - 1];
                        const currentAltitude = location.coords.altitude ?? 0;
                        if (currentAltitude > lastAltitude + 2) {
                            return prev + (currentAltitude - lastAltitude);
                        }
                        return prev;
                    });
                    setRunAltitude((prev) => [
                        ...prev,
                        location.coords.altitude ?? 0,
                    ]);
                }
            );
        })();

        return () => {
            subscription?.remove();
        };
    }, [addRunLine]);

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            <TopBlurView>
                <WeatherInfo />
                <Text style={styles.timeText}>
                    {getRunTime(runTime, "MM:SS")}
                </Text>
            </TopBlurView>
            <MapViewWrapper hasLocateMe={false}>
                <ShapeSource
                    id="run-line"
                    shape={{
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: runLine,
                        },
                        properties: {
                            color: colors.primary,
                        },
                    }}
                >
                    <LineLayer
                        id="run-line"
                        style={mapboxStyles.activeLineLayer}
                    />
                </ShapeSource>
            </MapViewWrapper>
            <View style={styles.bottomSheetContainer}>
                <View style={styles.bottomSheetDivider} />
                <View style={styles.bottomSheetContent}>
                    <StatsIndicator stats={stats} color="gray20" />
                </View>
            </View>
            {isRunning && (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        setIsRunning(false);
                    }}
                    color="red"
                    direction="right"
                />
            )}
            {!isRunning && (
                <SlideToDualAction
                    onSlideLeft={() => {
                        console.log("기록 저장");
                        router.back();
                    }}
                    onSlideRight={() => {
                        console.log("이어서 뛰기");
                        setIsRunning(true);
                    }}
                    leftLabel="기록 저장"
                    rightLabel="이어서 뛰기"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
    bottomSheetContainer: {
        backgroundColor: "#111111",
        alignItems: "center",
    },
    bottomSheetDivider: {
        width: 50,
        height: 5,
        backgroundColor: colors.gray[40],
        borderRadius: 100,
        marginTop: 10,
    },
    bottomSheetContent: {
        paddingVertical: 30,
    },
});
