import { getRunTelemetries, getRunTelemetriesByCourseId } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine, { Segment } from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import Countdown from "@/src/components/ui/Countdown";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import useRunningSession from "@/src/hooks/useRunningSession";
import colors from "@/src/theme/colors";
import { RunnningStatus, UserDashBoardData } from "@/src/types/run";
import {
    findClosest,
    interpolateTelemetries,
} from "@/src/utils/interpolateTelemetries";
import {
    getFormattedPace,
    getRunTime,
    saveRunning,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Dimensions, StyleSheet, View } from "react-native";
import { ConfettiMethods, PIConfetti } from "react-native-fast-confetti";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function CourseRun() {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const { courseId, ghostRunningId } = useLocalSearchParams();
    const [isRestarting, setIsRestarting] = useState<boolean>(false);

    const [mode, setMode] = useState<"COURSE" | "GHOST">("COURSE");

    const [courseName, setCourseName] = useState<string>("");
    const [courseTelemetries, setCourseTelemetries] = useState<Telemetry[]>([]);
    const ghostTelemetries = useRef<Telemetry[]>([]);
    const [courseSegment, setCourseSegment] = useState<Segment>();
    const [ghostSegments, setGhostSegments] = useState<Segment[]>([]);
    const [ghostCurrentPosition, setGhostCurrentPosition] = useState<{
        lng: number;
        lat: number;
    }>({ lng: 0, lat: 0 });
    const confettiRef = useRef<ConfettiMethods | null>(null);

    const {
        currentRunType,
        runSegments,
        runTelemetries,
        updateRunStatus,
        runStatus,
        runTime,
        runUserDashboardData,
        courseIndex,
        updateRunType,
    } = useRunningSession({
        course: courseTelemetries ?? [],
        type: "COURSE",
    });

    // 코스와 고스트 러닝 데이터 가져오기
    useEffect(() => {
        Promise.all([
            getRunTelemetriesByCourseId(Number(courseId)),
            getRunTelemetries(Number(ghostRunningId)),
        ])
            .then(([course, ghostRunning]) => {
                setCourseName(course.name);
                setCourseTelemetries(course.coordinates);
                setCourseSegment(
                    telemetriesToSegment(course.coordinates, 0)[1]
                );

                if (ghostRunningId === "-1") {
                    setMode("COURSE");
                } else {
                    setMode("GHOST");
                    ghostTelemetries.current = interpolateTelemetries(
                        ghostRunning,
                        250
                    );
                }
            })
            .catch(() => {
                Alert.alert(
                    "데이터 로딩 오류",
                    "러닝 데이터를 불러오는데 실패했습니다",
                    [
                        {
                            text: "확인",
                            onPress: () => {
                                router.back();
                            },
                        },
                    ]
                );
            });
    }, [courseId, ghostRunningId]);

    const onCompleteRestart = async (runStatus: RunnningStatus) => {
        if (isRestarting) {
            setIsRestarting(false);
            if (runStatus === "stop_running" || runStatus === "pause_running") {
                Toast.show({
                    type: "success",
                    text1: "러닝을 이어서 진행합니다",
                    position: "bottom",
                    bottomOffset: 60,
                    visibilityTime: 3000,
                });
            }
            await updateRunStatus("start_running");
        }
    };

    // 뒤로가기 버튼 비활성화
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

    useEffect(() => {
        if (runStatus === "ready_course_running") {
            setIsRestarting(true);
        }

        if (runStatus === "complete_course_running") {
            confettiRef.current?.restart();
        }
    }, [runStatus]);

    useEffect(() => {
        if (
            mode !== "GHOST" ||
            currentRunType !== "COURSE" ||
            runStatus !== "start_running" ||
            ghostTelemetries.current.length <= 1
        )
            return;

        const ghostTelemetry = findClosest(
            ghostTelemetries.current,
            runTime * 1000,
            (r) => r.timeStamp
        );

        if (!ghostTelemetry) return;

        ghostTelemetries.current = ghostTelemetries.current.filter((t) => {
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
    }, [runTime, runStatus, currentRunType, mode]);

    useEffect(() => {
        if (
            mode !== "GHOST" ||
            currentRunType !== "COURSE" ||
            runStatus !== "start_running"
        )
            return;

        const currentGhostTelemetry = findClosest(
            ghostTelemetries.current,
            runTime * 1000,
            (r) => r.timeStamp
        );

        if (!currentGhostTelemetry) return;

        setGhostCurrentPosition({
            lng: currentGhostTelemetry.lng,
            lat: currentGhostTelemetry.lat,
        });
    }, [runTime, mode, currentRunType, runStatus]);

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 116,
        };
    });

    const renderSlideToAction = useCallback(
        (
            status: RunnningStatus,
            currentRunType: "SOLO" | "COURSE",
            mode: "GHOST" | "COURSE",
            runTelemetries: Telemetry[],
            runUserDashboardData: UserDashBoardData,
            runTime: number
        ) => {
            if (
                status === "before_running" ||
                status === "ready_course_running" ||
                status === "start_running"
            ) {
                return (
                    <SlideToAction
                        label="밀어서 러닝 종료"
                        onSlideSuccess={async () => {
                            if (status === "start_running") {
                                await updateRunStatus("pause_running");
                            } else {
                                router.back();
                            }
                        }}
                        color="red"
                        direction="right"
                        disabled={isRestarting}
                    />
                );
            } else if (status === "stop_running") {
                return (
                    <SlideToDualAction
                        leftLabel={"러닝 종료"}
                        rightLabel={"일반 러닝 전환"}
                        onSlideLeft={async () => {
                            const response = await saveRunning({
                                telemetries: runTelemetries,
                                userDashboardData: runUserDashboardData,
                                runTime,
                                isPublic: true,
                            });
                            router.replace(
                                `/result/${response.runningId}/-1/-1`
                            );
                        }}
                        onSlideRight={async () => {
                            await updateRunType("SOLO");
                            setIsRestarting(true);
                        }}
                        color="red"
                    />
                );
            } else if (status === "pause_running") {
                return (
                    <SlideToDualAction
                        leftLabel={"기록 저장"}
                        rightLabel={"이어서 뛰기"}
                        onSlideLeft={async () => {
                            const response = await saveRunning({
                                telemetries: runTelemetries,
                                userDashboardData: runUserDashboardData,
                                runTime,
                                isPublic: true,
                            });
                            router.replace(
                                `/result/${response.runningId}/-1/-1`
                            );
                        }}
                        onSlideRight={async () => {
                            setIsRestarting(true);
                        }}
                        color="primary"
                    />
                );
            } else if (status === "complete_course_running") {
                return (
                    <SlideToDualAction
                        leftLabel={"결과 및 랭킹"}
                        rightLabel={"이어서 뛰기"}
                        onSlideLeft={async () => {
                            const response = await saveRunning({
                                telemetries: runTelemetries,
                                userDashboardData: runUserDashboardData,
                                runTime,
                                isPublic: true,
                                courseId: Number(courseId),
                                ghostRunningId:
                                    Number(ghostRunningId) > 0
                                        ? Number(ghostRunningId)
                                        : undefined,
                            });
                            router.replace(
                                `/result/${
                                    response.runningId ?? response
                                }/${courseId}/${ghostRunningId}`
                            );
                        }}
                        onSlideRight={async () => {
                            await saveRunning({
                                telemetries: runTelemetries,
                                userDashboardData: runUserDashboardData,
                                runTime,
                                isPublic: true,
                                courseId: Number(courseId),
                                ghostRunningId:
                                    Number(ghostRunningId) > 0
                                        ? Number(ghostRunningId)
                                        : undefined,
                            });
                            await updateRunType("SOLO");
                            setIsRestarting(true);
                        }}
                        color="primary"
                    />
                );
            }
        },
        [courseId, ghostRunningId, isRestarting, updateRunStatus, updateRunType]
    );

    useEffect(() => {
        if (runStatus === "stop_running") {
            let count = 0;
            const interval = setInterval(async () => {
                if (count * 4 === 60 * 1000) {
                    Toast.show({
                        type: "info",
                        text1: "일반 러닝으로 전환합니다",
                        position: "bottom",
                        bottomOffset: 60,
                        visibilityTime: 3000,
                    });
                    clearInterval(interval);
                    await updateRunType("SOLO");
                    setIsRestarting(true);
                    return;
                }

                if (count % 2 === 0) {
                    Toast.show({
                        type: "info",
                        text1: "코스를 이탈하였습니다",
                        position: "bottom",
                        bottomOffset: 60,
                        visibilityTime: 3000,
                    });
                } else {
                    Toast.show({
                        type: "info",
                        text1: "10분 뒤 자동 종료됩니다",
                        position: "bottom",
                        bottomOffset: 60,
                        visibilityTime: 3000,
                    });
                }
                count++;
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [runStatus, updateRunStatus, updateRunType]);

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            <TopBlurView>
                <WeatherInfo />
                {isRestarting ? (
                    <Countdown
                        count={3}
                        color={colors.primary}
                        size={60}
                        onComplete={() => onCompleteRestart(runStatus)}
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
                {/* 현재 기록에 대한 세그먼트 렌더링 */}
                {runSegments.map((segment, index) => (
                    <RunningLine
                        key={index.toString()}
                        index={index}
                        segment={segment}
                        belowLayerID={
                            mode === "GHOST" ? "custom-puck-layer-2" : undefined
                        }
                    />
                ))}
                {/* 코스에 대한 세그먼트 렌더링 */}
                {courseSegment && currentRunType === "COURSE" && (
                    <RunningLine index="course" segment={courseSegment} />
                )}
                {/* 고스트에 대한 세그먼트 렌더링 */}
                {mode === "GHOST" &&
                    currentRunType === "COURSE" &&
                    ghostSegments.map((segment, index) => (
                        <RunningLine
                            key={index.toString()}
                            index={"ghost" + index}
                            segment={segment}
                            belowLayerID="custom-puck-layer-2"
                            color="red"
                        />
                    ))}
                {/* 코스 이탈 또는 일시정지 시 마지막 위치 렌더링 */}
                {currentRunType === "COURSE" &&
                    (runStatus === "stop_running" ||
                        runStatus === "pause_running" ||
                        runStatus === "before_running") &&
                    courseTelemetries.length > 0 && (
                        <ShapeSource
                            id="custom-puck"
                            shape={{
                                type: "Point",
                                coordinates: [
                                    courseTelemetries[courseIndex ?? 0].lng,
                                    courseTelemetries[courseIndex ?? 0].lat,
                                ],
                            }}
                        >
                            <SymbolLayer
                                id="custom-puck-layer"
                                style={{
                                    iconImage: "puck2",
                                    iconAllowOverlap: true,
                                }}
                                aboveLayerID="segment-course"
                            />
                        </ShapeSource>
                    )}
                {/* 고스트에 대한 현재 위치 렌더링 */}
                {mode === "GHOST" && currentRunType === "COURSE" && (
                    <ShapeSource
                        id="custom-puck-2"
                        shape={{
                            type: "Point",
                            coordinates: [
                                ghostCurrentPosition.lng,
                                ghostCurrentPosition.lat,
                            ],
                        }}
                    >
                        <SymbolLayer
                            id="custom-puck-layer-2"
                            style={{
                                iconImage: "puck3",
                                iconAllowOverlap: true,
                            }}
                            aboveLayerID="segment-course"
                        />
                    </ShapeSource>
                )}
            </MapViewWrapper>
            {runStatus === "complete_course_running" && (
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
            >
                <BottomSheetView>
                    <View style={styles.bottomSheetContent}>
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
                            ghost={
                                mode === "GHOST" && currentRunType === "COURSE"
                            }
                            ghostTelemetry={ghostTelemetries.current[0]}
                            color="gray20"
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>
            {renderSlideToAction(
                runStatus,
                currentRunType,
                mode,
                runTelemetries,
                runUserDashboardData,
                runTime
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
