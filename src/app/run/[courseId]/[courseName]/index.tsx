import { getRunTelemetriesByCourseId } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
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
import useRunning, { RunningStatus } from "@/src/hooks/useRunningV2";
import colors from "@/src/theme/colors";
import {
    getFormattedPace,
    getRunTime,
    saveRunning,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Dimensions, StyleSheet, View } from "react-native";
import { ConfettiMethods, PIConfetti } from "react-native-fast-confetti";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Course() {
    const { courseId, courseName } = useLocalSearchParams();
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const [course, setCourse] = useState<Telemetry[]>([]);

    useEffect(() => {
        getRunTelemetriesByCourseId(Number(courseId)).then((data) => {
            setCourse(data);
        });
    }, [courseId]);

    const {
        status,
        setRunningStatus,
        courseIndex,
        userDashboardData,
        telemetries,
        courseCompletedTelemetries,
        runTime,
        courseRunTime,
        segments,
        completedAt,
        totalStepCount,
        courseStepCount,
        courseDashboardData,
    } = useRunning({
        type: "course",
        mode: "solo",
        weight: 70,
        course,
    });

    const confettiRef = useRef<ConfettiMethods | null>(null);

    const dashboardData = useMemo(() => {
        if (status === "completed") {
            return courseDashboardData;
        }
        return userDashboardData;
    }, [status, courseDashboardData, userDashboardData]);

    const stats = [
        {
            label: "거리",
            value: (dashboardData.totalDistance / 1000).toFixed(2),
            unit: "km",
        },
        {
            label: "평균 페이스",
            value: getFormattedPace(dashboardData.paceOfLastPoints),
            unit: "",
        },
        {
            label: "케이던스",
            value: dashboardData.cadenceOfLastPoints.toString(),
            unit: "spm",
        },
        {
            label: "고도",
            value: dashboardData.totalElevationGain.toFixed(0),
            unit: "m",
        },
        {
            label: "칼로리",
            value: dashboardData.totalCalories.toFixed(0),
            unit: "kcal",
        },
        { label: "BPM", value: dashboardData.bpm, unit: "" },
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

    const onCompleteRestart = (status: RunningStatus) => {
        setIsRestarting(false);
        setRunningStatus(status);
    };

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 116,
        };
    });

    useEffect(() => {
        if (status === "before_course_running") {
            setIsRestarting(true);
        }

        if (status === "completed") {
            confettiRef.current?.restart();
        }
    }, [status]);

    const renderSlideToAction = useCallback(
        (status: RunningStatus) => {
            switch (status) {
                case "before_running":
                case "before_course_running":
                case "cancel_course_running":
                    return (
                        <SlideToAction
                            label="밀어서 러닝 종료"
                            onSlideSuccess={() => {
                                router.replace("/(tabs)/home");
                            }}
                            color="red"
                            direction="left"
                            disabled={
                                isRestarting ||
                                status === "before_course_running" ||
                                status === "cancel_course_running"
                            }
                        />
                    );
                case "course_running":
                case "free_running":
                    return (
                        <SlideToAction
                            label="밀어서 러닝 종료"
                            onSlideSuccess={() => {
                                setRunningStatus("paused");
                            }}
                            color="red"
                            direction="left"
                            disabled={isRestarting}
                        />
                    );
                case "paused":
                    return (
                        <SlideToDualAction
                            leftLabel="기록 저장"
                            rightLabel="이어서 뛰기"
                            onSlideLeft={async () => {
                                const response = await saveRunning({
                                    telemetries,
                                    userDashboardData,
                                    runTime,
                                    isPublic: true,
                                    memberId: 1,
                                    totalStepCount,
                                });
                                router.replace(
                                    `/result/${response.runningId}/-1//-1`
                                );
                            }}
                            onSlideRight={() => {
                                setIsRestarting(true);
                            }}
                        />
                    );
                case "stopped":
                    return (
                        <SlideToDualAction
                            leftLabel="러닝 종료"
                            rightLabel="일반 러닝 전환"
                            onSlideLeft={async () => {
                                const response = await saveRunning({
                                    telemetries,
                                    userDashboardData,
                                    runTime,
                                    isPublic: true,
                                    memberId: 1,
                                    totalStepCount,
                                });
                                router.replace(
                                    `/result/${response.runningId}/-1//-1`
                                );
                            }}
                            onSlideRight={() => {
                                setRunningStatus("cancel_course_running");
                                setIsRestarting(true);
                            }}
                        />
                    );
                case "completed":
                    return (
                        <SlideToDualAction
                            leftLabel="결과 및 랭킹"
                            rightLabel="이어서 뛰기"
                            onSlideLeft={async () => {
                                const runningId = await saveRunning({
                                    telemetries: courseCompletedTelemetries,
                                    userDashboardData: courseDashboardData,
                                    runTime: courseRunTime || runTime,
                                    isPublic: true,
                                    memberId: 1,
                                    totalStepCount: courseStepCount,
                                    courseId: Number(courseId),
                                });
                                router.replace(
                                    `/result/${runningId}/${courseId}/-1`
                                );
                            }}
                            onSlideRight={async () => {
                                await saveRunning({
                                    telemetries: courseCompletedTelemetries,
                                    userDashboardData: courseDashboardData,
                                    runTime: courseRunTime || runTime,
                                    isPublic: true,
                                    memberId: 1,
                                    totalStepCount: courseStepCount,
                                    courseId: Number(courseId),
                                });
                                setIsRestarting(true);
                            }}
                        />
                    );
            }
        },
        [
            router,
            setRunningStatus,
            isRestarting,
            telemetries,
            userDashboardData,
            runTime,
            totalStepCount,
            courseId,
            courseRunTime,
            courseCompletedTelemetries,
            courseStepCount,
            courseDashboardData,
        ]
    );

    return (
        course &&
        course.length > 0 && (
            <View style={[styles.container, { paddingBottom: bottom }]}>
                <TopBlurView>
                    <WeatherInfo />
                    {isRestarting ? (
                        <Countdown
                            count={3}
                            color={colors.primary}
                            size={60}
                            onComplete={() =>
                                onCompleteRestart(
                                    completedAt ||
                                        courseRunTime === -1 ||
                                        status === "cancel_course_running"
                                        ? "free_running"
                                        : "course_running"
                                )
                            }
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
                            {getRunTime(
                                status === "completed"
                                    ? courseRunTime || 0
                                    : runTime,
                                "MM:SS"
                            )}
                        </Animated.Text>
                    )}
                </TopBlurView>

                <MapViewWrapper controlPannelPosition={controlPannelPosition}>
                    {(status === "before_running" ||
                        status === "paused" ||
                        status === "stopped") &&
                    courseRunTime === null ? (
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
                    ) : null}

                    {segments.map((segment, index) => (
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
                            {status === "completed" && !isRestarting && (
                                <>
                                    <View style={styles.courseComplete}>
                                        <Typography
                                            variant="headline"
                                            color="white"
                                        >
                                            {courseName === "null"
                                                ? ""
                                                : courseName}
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

                {renderSlideToAction(status)}
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
