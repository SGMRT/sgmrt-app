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
        Toast.show({
            type: "success",
            text1: "Success",
            position: "bottom",
            bottomOffset: 60,
        });
    }, []);

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
