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
import { getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Run() {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(true);
    const {
        isRunning,
        runTime,
        segments,
        totalDistance,
        elevationGain,
        cadence,
        calories,
        pace,
        startRunning,
        stopRunning,
    } = useRunningSession();

    const stats = [
        { label: "거리", value: (totalDistance / 1000).toFixed(2), unit: "km" },
        {
            label: "평균 페이스",
            value: pace,
            unit: "",
        },
        { label: "케이던스", value: cadence.toString(), unit: "spm" },
        {
            label: "고도",
            value: elevationGain.toFixed(0),
            unit: "m",
        },
        {
            label: "칼로리",
            value: calories.toFixed(0),
            unit: "kcal",
        },
        { label: "BPM", value: "--", unit: "" },
    ];

    useEffect(() => {
        bottomSheetRef.current?.present();
    }, []);

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
            <MapViewWrapper hasLocateMe={false}>
                {segments.map(
                    (segment, index) =>
                        segment.points.length > 0 && (
                            <RunningLine
                                key={index.toString()}
                                index={index}
                                segment={segment}
                            />
                        )
                )}
            </MapViewWrapper>
            <View style={styles.bottomSheetContainer}>
                <View style={styles.bottomSheetDivider} />
                <View style={styles.bottomSheetContent}>
                    <StatsIndicator stats={stats} color="gray20" />
                </View>
            </View>
            {isRunning ? (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        stopRunning();
                    }}
                    color="red"
                    direction="right"
                />
            ) : (
                <SlideToDualAction
                    onSlideLeft={() => {
                        console.log("기록 저장");
                        router.back();
                    }}
                    onSlideRight={() => {
                        console.log("이어서 뛰기");
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
