import { getRunTelemetries, getRunTelemetriesByCourseId } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine, { Segment } from "@/src/components/map/RunningLine";
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
    findClosest,
    interpolateTelemetries,
} from "@/src/utils/interpolateTelemetries";
import {
    getFormattedPace,
    getRunTime,
    saveRunning,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
    StyleSheet,
    View,
} from "react-native";
import { ConfettiMethods, PIConfetti } from "react-native-fast-confetti";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Course() {
    const { courseId, courseName, ghostRunningId } = useLocalSearchParams();
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const [course, setCourse] = useState<Telemetry[]>([]);
    const ghostTelemetries = useRef<Telemetry[]>([]);
    const [ghostSegments, setGhostSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isGhostRunning =
        ghostTelemetries.current.length > 0 || ghostSegments.length > 0;

    useEffect(() => {
        const fetch = () => {
            Promise.all([
                getRunTelemetriesByCourseId(Number(courseId)),
                getRunTelemetries(Number(ghostRunningId)),
            ]).then(([course, rawGhostTelemetries]) => {
                setCourse(course);
                const newGhostTelemetries = interpolateTelemetries(
                    rawGhostTelemetries,
                    250
                );
                ghostTelemetries.current = newGhostTelemetries;
                setIsLoading(false);
            });
        };

        fetch();
    }, [courseId, ghostRunningId]);

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
        weight: 70,
        course,
    });

    useEffect(() => {
        if (ghostTelemetries.current.length <= 1) return;

        const ghostTelemetry = findClosest(
            ghostTelemetries.current,
            runTime * 1000,
            (r) => r.timeStamp
        );

        if (!ghostTelemetry) return;

        ghostTelemetries.current = ghostTelemetries.current.filter((t) => {
            // 현재 선택된 ghostTelemetry의 timeStamp보다 큰 값만 남김
            return t.timeStamp >= ghostTelemetry.timeStamp;
        });

        setGhostSegments((prev) => {
            // 마지막 points
            const lastPoints = prev.length > 0 ? prev.at(-1)!.points : [];
            // 마지막 위치와 다를 때만 push
            const lastPoint = lastPoints.at(-1);
            const isNewPoint =
                !lastPoint ||
                lastPoint.latitude !== ghostTelemetry.lat ||
                lastPoint.longitude !== ghostTelemetry.lng;

            if (!isNewPoint) return prev;

            console.log(isNewPoint);

            // 새 배열/객체로 복사 (불변성 유지)
            const newSegments = prev.length
                ? [
                      ...prev.slice(0, -1),
                      {
                          ...prev.at(-1)!,
                          points: [
                              ...lastPoints,
                              {
                                  latitude: ghostTelemetry.lat,
                                  longitude: ghostTelemetry.lng,
                              },
                          ],
                      },
                  ]
                : [
                      {
                          isRunning: true,
                          points: [
                              {
                                  latitude: ghostTelemetry.lat,
                                  longitude: ghostTelemetry.lng,
                              },
                          ],
                      },
                  ];
            return newSegments;
        });
    }, [runTime]);

    const confettiRef = useRef<ConfettiMethods | null>(null);

    const dashboardData = useMemo(() => {
        if (status === "completed") {
            return courseDashboardData;
        }
        return userDashboardData;
    }, [status, courseDashboardData, userDashboardData]);

    const stats = useMemo(
        () => [
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
        ],
        [dashboardData]
    );

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
                                    ghostRunningId:
                                        ghostRunningId === "-1"
                                            ? undefined
                                            : Number(ghostRunningId),
                                });
                                router.replace(
                                    `/result/${runningId}/${courseId}/${ghostRunningId}`
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
                                    ghostRunningId:
                                        ghostRunningId === "-1"
                                            ? undefined
                                            : Number(ghostRunningId),
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
            ghostRunningId,
        ]
    );

    return isLoading ? (
        <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    ) : (
        course && course.length > 0 && (
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

                    {segments
                        .filter((segment) => segment.isRunning)
                        .map((segment, index) => (
                            <RunningLine
                                key={index.toString()}
                                index={"running" + index}
                                segment={segment}
                                aboveLayerID="custom-puck-layer"
                            />
                        ))}

                    {segments
                        .filter((segment) => !segment.isRunning)
                        .map((segment, index) => (
                            <RunningLine
                                key={index.toString()}
                                index={"course" + index}
                                segment={segment}
                                belowLayerID="custom-puck-layer"
                            />
                        ))}

                    {isGhostRunning && status !== "completed" ? (
                        <>
                            {ghostSegments.map((segment, index) => (
                                <RunningLine
                                    key={index.toString()}
                                    index={"ghost" + index}
                                    segment={segment}
                                    color="red"
                                    aboveLayerID="segment-course0"
                                />
                            ))}
                            <ShapeSource
                                id="custom-puck-2"
                                shape={{
                                    type: "Point",
                                    coordinates: [
                                        ghostTelemetries.current[0].lng,
                                        ghostTelemetries.current[0].lat,
                                    ],
                                }}
                            >
                                <SymbolLayer
                                    id="custom-puck-layer-2"
                                    style={{
                                        iconImage: "puck3",
                                        iconAllowOverlap: true,
                                    }}
                                />
                            </ShapeSource>
                        </>
                    ) : null}
                </MapViewWrapper>

                {status === "completed" && (
                    <PIConfetti
                        ref={confettiRef}
                        fallDuration={4000}
                        count={100}
                        colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
                        fadeOutOnEnd={true}
                        height={Dimensions.get("window").height / 2 - 100}
                    />
                )}

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
                                                : courseName + " "}
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
                            <StatsIndicator
                                stats={stats}
                                ghost={isGhostRunning}
                                ghostTelemetry={ghostTelemetries.current[0]}
                                color="gray20"
                            />
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
