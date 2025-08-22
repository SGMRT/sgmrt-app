import { Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShareShotHandle } from "@/src/components/shot/RunShot";
import Countdown from "@/src/components/ui/Countdown";
import EmptyListView from "@/src/components/ui/EmptyListView";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import SlideToAction from "@/src/components/ui/SlideToAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useRunningSession } from "@/src/features/run/hooks/useRunningSession";
import { selectPolylineSegments } from "@/src/features/run/state/selectors";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

    const { context, controls } = useRunningSession();

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                return false;
            }
        );

        return () => backHandler.remove();
    }, []);

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

    const onCountdownComplete = useCallback(() => {
        if (context.status === "IDLE") {
            controls.start("SOLO");
        } else if (context.status === "COMPLETION_PENDING") {
            controls.extend();
        } else if (context.status === "PAUSED_USER") {
            controls.resume();
        } else if (context.status === "PAUSED_OFFCOURSE") {
            controls.oncourse();
        }
        setIsRestarting(false);
        setIsFirst(false);
    }, [context.status, controls]);

    const segments = useMemo(() => {
        return selectPolylineSegments(context);
    }, [context]);

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            {isSaving && (
                <>
                    <LoadingLayer
                        limitDelay={3000}
                        onDelayed={() => {
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
                        onComplete={onCountdownComplete}
                    />
                ) : (
                    <Animated.Text
                        style={[styles.timeText, { color: colors.white }]}
                        entering={FadeIn.duration(1000)}
                    >
                        {getRunTime(
                            Math.round(context.stats.totalTimeMs / 1000),
                            "MM:SS"
                        )}
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
                                            context.stats.totalDistanceM / 1000
                                        ).toFixed(2),
                                        unit: "km",
                                    },
                                    {
                                        label: "평균 페이스",
                                        value: getFormattedPace(
                                            context.stats.avgPaceSecPerKm ?? 0
                                        ),
                                        unit: "",
                                    },
                                    {
                                        label: "최근 페이스",
                                        value: getFormattedPace(
                                            context.stats.currentPaceSecPerKm ??
                                                0
                                        ),
                                        unit: "",
                                    },
                                    {
                                        label: "케이던스",
                                        value: context.stats.cadenceSpm ?? 0,
                                        unit: "spm",
                                    },
                                    {
                                        label: "심박수",
                                        value: context.stats.bpm ?? 0,
                                        unit: "",
                                    },
                                    {
                                        label: "소모 칼로리",
                                        value: context.stats.calories ?? 0,
                                        unit: "kcal",
                                    },
                                ]}
                                color="gray20"
                            />
                        )}
                    </View>
                </BottomSheetView>
            </BottomSheet>
            {context.status === "RUNNING" ? (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        controls.pauseUser();
                    }}
                    color="red"
                    direction="right"
                />
            ) : (
                <SlideToAction
                    label="재개 하기"
                    onSlideSuccess={() => {
                        controls.resume();
                    }}
                    color="red"
                    direction="right"
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
