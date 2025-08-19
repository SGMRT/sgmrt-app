import { Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShareShotHandle } from "@/src/components/shot/RunShot";
import Countdown from "@/src/components/ui/Countdown";
import EmptyListView from "@/src/components/ui/EmptyListView";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import useRunningSession from "@/src/hooks/useRunningSession";
import colors from "@/src/theme/colors";
import {
    getFormattedPace,
    getRunTime,
    getTelemetriesWithoutLastFalse,
    saveRunning,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
    const [isFirst, setIsFirst] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const runShotRef = useRef<RunShareShotHandle>(null);
    const [runShotUri, setRunShotUri] = useState<string | null>(null);

    const {
        runSegments,
        runTelemetries,
        updateRunStatus,
        runStatus,
        runTime,
        runUserDashboardData,
        rawRunData,
    } = useRunningSession({});

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                return false;
            }
        );

        return () => backHandler.remove();
    }, []);

    const onCompleteRestart = async () => {
        if (isRestarting) {
            setIsRestarting(false);
            await updateRunStatus("start_running");
            setIsFirst(false);
        }
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
        const canSave =
            isSaving && savingTelemetries.length > 0 && runShotUri !== null;
        if (!canSave) return;

        (async () => {
            try {
                const response = await saveRunning({
                    telemetries: savingTelemetries,
                    rawData: rawRunData,
                    runShotUri,
                    userDashboardData: runUserDashboardData,
                    runTime,
                    isPublic: true,
                });

                if (response) {
                    router.replace({
                        pathname:
                            "/result/[runningId]/[courseId]/[ghostRunningId]",
                        params: {
                            runningId: response.runningId.toString(),
                            courseId: "-1",
                            ghostRunningId: "-1",
                        },
                    });
                } else {
                    Toast.show({
                        type: "info",
                        text1: "기록 저장에 실패했습니다. 다시 시도해주세요.",
                        position: "bottom",
                        bottomOffset: 60,
                    });
                }
            } catch (e) {
                console.log(e);
                Toast.show({
                    type: "info",
                    text1: "기록 저장에 실패했습니다. 다시 시도해주세요.",
                    position: "bottom",
                    bottomOffset: 60,
                });
            } finally {
                setIsSaving(false);
                setSavingTelemetries([]);
                setRunShotUri(null);
            }
        })();
    }, [
        isSaving,
        savingTelemetries,
        runShotUri,
        rawRunData,
        runUserDashboardData,
        runTime,
        router,
    ]);

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 116,
        };
    });

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            {isSaving && (
                <>
                    <LoadingLayer />
                    {savingTelemetries.length > 0 && (
                        <RunShot
                            ref={runShotRef}
                            fileName={"runImage.jpg"}
                            telemetries={savingTelemetries}
                            isChartActive
                            showLogo={false}
                            chartPointIndex={0}
                            yKey="alt"
                            stats={[]}
                            onMapReady={() => {
                                runShotRef.current
                                    ?.capture()
                                    .then((uri) => {
                                        setRunShotUri(uri);
                                    })
                                    .catch((e) => {
                                        setRunShotUri("");
                                    });
                            }}
                        />
                    )}
                </>
            )}
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
                {runSegments.map((segment, index) => (
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
                        {isFirst ? (
                            <EmptyListView
                                description={`러닝을 도중에 정지할 경우\n코스 및 러닝 기록 공개가 불가능합니다`}
                                iconColor={colors.red}
                                fontSize="headline"
                                fontColor="white"
                            />
                        ) : (
                            <StatsIndicator
                                stats={[
                                    {
                                        label: "거리",
                                        value: (
                                            runUserDashboardData.totalDistance /
                                            1000
                                        ).toFixed(2),
                                        unit: "km",
                                    },
                                    {
                                        label: "평균 페이스",
                                        value: getFormattedPace(
                                            runUserDashboardData.averagePace
                                        ),
                                        unit: "",
                                    },
                                    {
                                        label: "최근 페이스",
                                        value: getFormattedPace(
                                            runUserDashboardData.recentPointsPace
                                        ),
                                        unit: "",
                                    },
                                    {
                                        label: "케이던스",
                                        value: runUserDashboardData.averageCadence,
                                        unit: "spm",
                                    },
                                    {
                                        label: "심박수",
                                        value: runUserDashboardData.bpm,
                                        unit: "",
                                    },
                                    {
                                        label: "소모 칼로리",
                                        value: runUserDashboardData.totalCalories,
                                        unit: "kcal",
                                    },
                                ]}
                                color="gray20"
                            />
                        )}
                    </View>
                </BottomSheetView>
            </BottomSheet>
            {runStatus === "start_running" || runStatus === "before_running" ? (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={async () => {
                        if (runStatus === "start_running") {
                            await updateRunStatus("pause_running");
                        } else {
                            router.back();
                        }
                    }}
                    color="red"
                    direction="right"
                    disabled={isRestarting}
                />
            ) : (
                <SlideToDualAction
                    onSlideLeft={async () => {
                        if (isSaving) return;
                        const truncated =
                            getTelemetriesWithoutLastFalse(runTelemetries);
                        setSavingTelemetries(truncated);
                        setRunShotUri(null); // 이전 URI 초기화
                        setIsSaving(true);
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
