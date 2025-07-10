import { getRunTelemetriesByCourseId } from "@/src/apis";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import Countdown from "@/src/components/ui/Countdown";
import { Divider } from "@/src/components/ui/Divider";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { Typography } from "@/src/components/ui/Typography";
import { useRunning } from "@/src/hooks/useRunning";
import colors from "@/src/theme/colors";
import {
    getFormattedPace,
    getRunTime,
    saveRunning,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Dimensions, StyleSheet, View } from "react-native";
import { ConfettiMethods, PIConfetti } from "react-native-fast-confetti";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Course() {
    const { courseId } = useLocalSearchParams();
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const { data: course, isLoading: courseIsLoading } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getRunTelemetriesByCourseId(Number(courseId)),
        enabled: !!courseId,
    });

    const {
        status,
        startTracking,
        pauseTracking,
        userDashboardData,
        telemetries,
        runTime,
        hasPaused,
        startTime,
        courseIndex,
        userSegments,
        stopCourseAndFreeRun,
        stopCourseRun,
        getTotalStepCount,
        completeTime,
        completeIndex,
        completeStepCount,
    } = useRunning({
        type: "course",
        mode: "ghost",
        weight: 70,
        ghostTelemetries: course,
    });

    const confettiRef = useRef<ConfettiMethods | null>(null);

    const stats = [
        {
            label: "거리",
            value: (userDashboardData.totalDistance / 1000).toFixed(2),
            unit: "km",
        },
        {
            label: "평균 페이스",
            value: getFormattedPace(userDashboardData.paceOfLastPoints),
            unit: "",
        },
        {
            label: "케이던스",
            value: userDashboardData.cadenceOfLastPoints.toString(),
            unit: "spm",
        },
        {
            label: "고도",
            value: userDashboardData.totalElevationGain.toFixed(0),
            unit: "m",
        },
        {
            label: "칼로리",
            value: userDashboardData.totalCalories.toFixed(0),
            unit: "kcal",
        },
        { label: "BPM", value: userDashboardData.bpm, unit: "" },
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
        startTracking();
    };

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 116,
        };
    });

    useEffect(() => {
        if (status === "waiting") {
            setIsRestarting(true);
        }

        if (status === "completed") {
            confettiRef.current?.restart();
        }
    }, [status]);

    if (courseIsLoading) {
        return <></>;
    }

    return (
        course && (
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
                            style={[
                                styles.timeText,
                                {
                                    color:
                                        status === "stopped"
                                            ? colors.red
                                            : status === "completed"
                                            ? colors.primary
                                            : colors.white,
                                },
                            ]}
                            entering={FadeIn.duration(1000)}
                        >
                            {getRunTime(runTime, "MM:SS")}
                        </Animated.Text>
                    )}
                </TopBlurView>

                <MapViewWrapper controlPannelPosition={controlPannelPosition}>
                    {!stopCourseRun &&
                        (status === "idle" ||
                            status === "paused" ||
                            status === "stopped") && (
                            <ShapeSource
                                id="custom-puck"
                                shape={{
                                    type: "Point",
                                    coordinates: [
                                        course[courseIndex].lng,
                                        course[courseIndex].lat,
                                    ],
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

                    {userSegments.map((segment, index) => (
                        <RunningLine
                            key={index.toString()}
                            index={-index}
                            segment={segment}
                        />
                    ))}
                </MapViewWrapper>

                <PIConfetti
                    ref={confettiRef}
                    fallDuration={4000}
                    count={100}
                    colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
                    fadeOutOnEnd={true}
                    height={Dimensions.get("window").height / 2 - 100}
                />

                <BottomSheet
                    backgroundStyle={styles.container}
                    bottomInset={bottom + 56}
                    handleStyle={styles.handle}
                    handleIndicatorStyle={styles.handleIndicator}
                    snapPoints={[15]}
                    index={1}
                    animatedPosition={heightVal}
                    containerStyle={{
                        position: "absolute",
                        zIndex: 1000,
                    }}
                >
                    <BottomSheetView>
                        <View style={styles.bottomSheetContent}>
                            {status === "completed" && (
                                <>
                                    <View style={styles.courseComplete}>
                                        <Typography
                                            variant="headline"
                                            color="white"
                                        >
                                            완주에 성공했어요!
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="gray40"
                                        >
                                            이어 달릴 경우 기록은 자동
                                            저장됩니다
                                        </Typography>
                                    </View>
                                    <Divider direction="horizontal" />
                                </>
                            )}

                            <StatsIndicator stats={stats} color="gray20" />
                        </View>
                    </BottomSheetView>
                </BottomSheet>
                {status === "idle" ||
                status === "running" ||
                status === "waiting" ||
                isRestarting ? (
                    <SlideToAction
                        label="밀어서 러닝 종료"
                        onSlideSuccess={() => {
                            if (status === "idle") {
                                router.back();
                            } else {
                                pauseTracking();
                            }
                        }}
                        color="red"
                        direction="right"
                        disabled={isRestarting || status === "waiting"}
                    />
                ) : (status === "stopped" || status === "paused") &&
                  !stopCourseRun ? (
                    <SlideToDualAction
                        leftLabel="러닝 종료"
                        rightLabel="일반 러닝 전환"
                        onSlideLeft={async () => {
                            const { courseId, runningId } = await saveRunning({
                                startTime: startTime!,
                                telemetries,
                                userDashboardData,
                                runTime,
                                hasPaused,
                                isPublic: true,
                                memberId: 1,
                                totalStepCount: getTotalStepCount(),
                            });
                            router.replace(`/result/${runningId}/-1/-1`);
                        }}
                        onSlideRight={() => {
                            stopCourseAndFreeRun();
                        }}
                        color="red"
                    />
                ) : status === "paused" ? (
                    <SlideToDualAction
                        leftLabel="기록 저장"
                        rightLabel="이어서 뛰기"
                        onSlideLeft={async () => {
                            const { runningId } = await saveRunning({
                                startTime: startTime!,
                                telemetries,
                                userDashboardData,
                                runTime,
                                hasPaused,
                                isPublic: true,
                                memberId: 1,
                                totalStepCount: getTotalStepCount(),
                                ghostRunningId: null,
                                courseId: Number(courseId),
                            });
                            router.replace(`/result/${runningId}/-1/-1`);
                        }}
                        onSlideRight={() => {
                            startTracking();
                        }}
                    />
                ) : status === "completed" ? (
                    <SlideToDualAction
                        leftLabel="결과 및 랭킹"
                        rightLabel="이어서 뛰기"
                        onSlideLeft={async () => {
                            const { runningId } = await saveRunning({
                                startTime: startTime!,
                                telemetries: telemetries.slice(
                                    0,
                                    completeIndex
                                ),
                                userDashboardData,
                                runTime: completeTime!,
                                hasPaused,
                                isPublic: true,
                                memberId: 1,
                                totalStepCount: completeStepCount,
                                ghostRunningId: null,
                                courseId: Number(courseId),
                            });
                            router.replace(
                                `/result/${runningId}/${courseId}/-1`
                            );
                        }}
                        onSlideRight={async () => {
                            await saveRunning({
                                startTime: startTime!,
                                telemetries: telemetries.slice(
                                    0,
                                    completeIndex
                                ),
                                userDashboardData,
                                runTime: completeTime!,
                                hasPaused,
                                isPublic: true,
                                memberId: 1,
                                totalStepCount: completeStepCount,
                                ghostRunningId: null,
                                courseId: Number(courseId),
                            }).then(() => {
                                Toast.show({
                                    type: "success",
                                    text1: "코스 기록 저장 완료",
                                    position: "bottom",
                                    visibilityTime: 1000,
                                });
                                stopCourseAndFreeRun();
                            });
                        }}
                    />
                ) : null}
            </View>
        )
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
        gap: 30,
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
    courseComplete: {
        gap: 4,
        alignItems: "center",
    },
});
