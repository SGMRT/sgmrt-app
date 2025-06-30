import { postRun } from "@/src/apis";
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
import { getFormattedPace, getRunName, getRunTime } from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Run() {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(true);
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
            startedAt: startTime,
            record,
            hasPaused,
            isPublic: false,
            telemetries: savedTelemetries,
        };
        const res = await postRun(running, 1);
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
            {isRunning || isRestarting ? (
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
