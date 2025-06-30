import { postCourseRun } from "@/src/apis";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import Countdown from "@/src/components/ui/Countdown";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useRunningSession } from "@/src/hooks/useRunningSession";
import colors from "@/src/theme/colors";
import { Coordinate, getDistance } from "@/src/utils/mapUtils";
import {
    getFormattedPace,
    getRunName,
    getRunTime,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const course: Telemetry[] = [
    {
        timeStamp: "0",
        lat: 37.3311133,
        lng: -122.03069859,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "1000",
        lat: 37.33104629,
        lng: -122.03067027,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "2000",
        lat: 37.33097983,
        lng: -122.03063943,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "3000",
        lat: 37.33091383,
        lng: -122.03061321,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "4000",
        lat: 37.33084313,
        lng: -122.03058427,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "5000",
        lat: 37.33077759,
        lng: -122.03056052,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "6000",
        lat: 37.33072336,
        lng: -122.0305179,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "7000",
        lat: 37.33070386,
        lng: -122.03044428,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "8000",
        lat: 37.33069778,
        lng: -122.03035543,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "9000",
        lat: 37.33068392,
        lng: -122.03028038,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "10000",
        lat: 37.33067599,
        lng: -122.03021599,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "11000",
        lat: 37.33067237,
        lng: -122.03014382,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "12000",
        lat: 37.33067364,
        lng: -122.03006986,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "13000",
        lat: 37.33067784,
        lng: -122.02998825,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "14000",
        lat: 37.3306811,
        lng: -122.02990041,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "15000",
        lat: 37.33068623,
        lng: -122.02980523,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "16000",
        lat: 37.33069273,
        lng: -122.02971484,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "17000",
        lat: 37.33069782,
        lng: -122.02962241,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "18000",
        lat: 37.33070167,
        lng: -122.02952527,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
    {
        timeStamp: "19000",
        lat: 37.33069587,
        lng: -122.02943077,
        dist: 0,
        pace: 0,
        alt: 0,
        cadence: 0,
        bpm: 0,
        isRunning: true,
    },
];

function checkStartPoint(currentPosition: Coordinate) {
    const startPoint = course[0];
    const distance = getDistance(
        { latitude: startPoint.lat, longitude: startPoint.lng },
        currentPosition
    );
    return distance < 10;
}

export default function Course() {
    const { courseId } = useLocalSearchParams();
    const [isPointSynced, setIsPointSynced] = useState(false);

    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const {
        isRunning,
        runTime,
        soloDashboardData,
        segments,
        telemetries,
        startRunning,
        stopRunning,
        startTime,
        hasPaused,
        getCurrentLocation,
    } = useRunningSession();

    async function saveRunning() {
        if (!startTime) return;
        if (soloDashboardData.distance === 0) {
            Toast.show({
                type: "info",
                text1: "러닝 거리가 너무 짧습니다.",
                position: "bottom",
                bottomOffset: 60,
            });
            return;
        }

        const record: RunRecord = {
            distance: soloDashboardData.distance,
            elevationGain: soloDashboardData.gainElevation,
            elevationLoss: soloDashboardData.lossElevation,
            duration: runTime,
            avgPace: soloDashboardData.avgPace,
            calories: soloDashboardData.calories,
            avgBpm:
                soloDashboardData.avgBpm === "--"
                    ? 0
                    : Number(soloDashboardData.avgBpm),
            avgCadence:
                soloDashboardData.avgCadence === "--"
                    ? 0
                    : Number(soloDashboardData.avgCadence),
        };

        const lastTrueIndex = telemetries.findLastIndex(
            (telemetry) => telemetry.isRunning
        );

        const savedTelemetries = telemetries.slice(0, lastTrueIndex + 1);

        const running: Running = {
            runningName: getRunName(startTime),
            mode: "SOLO",
            ghostRunningId: null,
            startedAt: startTime,
            record,
            hasPaused,
            isPublic: false,
            telemetries: savedTelemetries,
        };
        const res = await postCourseRun(running, 1, 1);
        return res;
    }

    const stats = [
        {
            label: "거리",
            value: (soloDashboardData.distance / 1000).toFixed(2),
            unit: "km",
        },
        {
            label: "평균 페이스",
            value: getFormattedPace(soloDashboardData.avgPace),
            unit: "",
        },
        {
            label: "케이던스",
            value: soloDashboardData.avgCadence.toString(),
            unit: "spm",
        },
        {
            label: "고도",
            value: soloDashboardData.gainElevation.toFixed(0),
            unit: "m",
        },
        {
            label: "칼로리",
            value: soloDashboardData.calories.toFixed(0),
            unit: "kcal",
        },
        { label: "BPM", value: soloDashboardData.avgBpm, unit: "" },
    ];

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                return false;
            }
        );

        return () => backHandler.remove();
    }, []);

    const onCompleteRestart = () => {
        setIsRestarting(false);
        startRunning();
    };

    useEffect(() => {
        if (isRestarting) {
            Toast.show({
                type: "info",
                text1: "3초 뒤 러닝이 시작됩니다.",
                position: "bottom",
                bottomOffset: 60,
                visibilityTime: 3000,
            });
        }
    }, [isRestarting]);

    useEffect(() => {
        const interval = setInterval(() => {
            const location = getCurrentLocation();
            if (location && !checkStartPoint(location)) {
                Toast.show({
                    text1: "시작 위치가 아닙니다.",
                    type: "info",
                    position: "bottom",
                    bottomOffset: 60,
                });
            } else {
                setIsPointSynced(true);
                clearInterval(interval);
                setIsRestarting(true);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isRunning, getCurrentLocation]);

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 116,
        };
    });

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            <TopBlurView>
                <WeatherInfo />
                {isRestarting ? (
                    <Countdown
                        count={3}
                        color={colors.primary}
                        size={60}
                        onComplete={onCompleteRestart}
                    />
                ) : (
                    <Animated.Text
                        style={[styles.timeText, { color: colors.white }]}
                        entering={FadeIn.duration(1000)}
                    >
                        {getRunTime(runTime, "MM:SS")}
                    </Animated.Text>
                )}
            </TopBlurView>

            <MapViewWrapper controlPannelPosition={controlPannelPosition}>
                {!isPointSynced && (
                    <ShapeSource
                        id="custom-puck"
                        shape={{
                            type: "Point",
                            coordinates: [course[0].lng, course[0].lat],
                        }}
                    >
                        <SymbolLayer
                            id="custom-puck-layer"
                            style={{
                                iconImage: "puck2",
                                iconAllowOverlap: true,
                            }}
                        />
                    </ShapeSource>
                )}
                <RunningLine
                    index={-1}
                    segment={telemetriesToSegment(course)}
                />
                {segments.map((segment, index) => (
                    <RunningLine
                        key={index.toString()}
                        index={index}
                        segment={segment}
                    />
                ))}
            </MapViewWrapper>
            <BottomSheet
                backgroundStyle={styles.container}
                bottomInset={bottom + 56}
                handleStyle={styles.handle}
                handleIndicatorStyle={styles.handleIndicator}
                snapPoints={[15]}
                index={1}
                animatedPosition={heightVal}
            >
                <BottomSheetView>
                    <View style={styles.bottomSheetContent}>
                        <StatsIndicator stats={stats} color="gray20" />
                    </View>
                </BottomSheetView>
            </BottomSheet>
            {isRunning || isRestarting || !isPointSynced ? (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        stopRunning();
                    }}
                    color="red"
                    direction="right"
                    disabled={isRestarting}
                />
            ) : (
                <SlideToDualAction
                    onSlideLeft={async () => {
                        console.log("기록 저장");
                        const { courseId, runningId } = await saveRunning();
                        router.replace(`/result/${courseId}/${runningId}`);
                    }}
                    onSlideRight={() => {
                        setIsRestarting(true);
                    }}
                    leftLabel="기록 저장"
                    rightLabel="이어서 뛰기"
                    disabled={isRestarting}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 0,
    },
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
    bottomSheetContent: {
        paddingVertical: 30,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 0,
    },
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
});
