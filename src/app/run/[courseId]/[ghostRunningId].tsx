import { getCourse, getRun } from "@/src/apis";
import { SoloRunGetResponse, Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine, { Segment } from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShotHandle } from "@/src/components/shot/RunShot";
import Countdown from "@/src/components/ui/Countdown";
import EmptyListView from "@/src/components/ui/EmptyListView";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useCourseProgress } from "@/src/features/course/hooks/useCourseProgress";
import { useGhostCoordinator } from "@/src/features/course/hooks/useGhostCoordinator";
import { useNow } from "@/src/features/run/hooks/useNow";
import { useRunningSession } from "@/src/features/run/hooks/useRunningSession";
import { buildUserRecordData } from "@/src/features/run/state/record";
import {
    selectPolylineSegments,
    selectStatsDisplay,
} from "@/src/features/run/state/selectors";
import { getElapsedMs } from "@/src/features/run/state/time";
import { extractRawData } from "@/src/features/run/utils/extractRawData";
import { useRunVoice } from "@/src/features/voice/useRunVoice";
import colors from "@/src/theme/colors";
import {
    getRunTime,
    saveRunning,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const [isFirst, setIsFirst] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const runShotRef = useRef<RunShotHandle>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

    const { courseId, ghostRunningId } = useLocalSearchParams();
    const isGhostRunning = ghostRunningId !== "-1";
    const [courseSegments, setCourseSegments] = useState<Segment>();

    const ghostRecordRef = useRef<SoloRunGetResponse | null>(null);

    const { context, controls } = useRunningSession();

    useRunVoice(context);

    const { initializeCourse, offcourseAnchor, legIndex, legs } =
        useCourseProgress({
            context,
            controls,
            onStart: () => {
                if (context.status === "READY" || isFirst) {
                    console.log("restarting");
                    setIsRestarting(true);
                }
            },
            onForceStop: () => {
                setWithRouting(true);
                requestSave();
            },
        });

    const ghostCoordinator = useGhostCoordinator({
        legs,
        ghostTelemetry: ghostRecordRef.current?.telemetries ?? [],
        myPoint: context.telemetries[context.telemetries.length - 1],
        myLegIndex: legIndex,
        timestamp: context.stats.totalTimeMs,
    });

    const hasSavedRef = useRef<boolean>(false);

    const triggerCapture = useCallback(() => {
        runShotRef.current
            ?.capture()
            .then((uri) => setThumbnailUri(uri))
            .catch(() => setThumbnailUri(""));
    }, []);

    useEffect(() => {
        (async () => {
            const response = await getCourse(Number(courseId));
            setCourseSegments(telemetriesToSegment(response.telemetries, 0)[1]);
            controls.start("COURSE", isGhostRunning ? "GHOST" : "PLAIN", {
                distanceMeters: response.distance,
            });
            initializeCourse(response.telemetries, response.courseCheckpoints);
            if (isGhostRunning) {
                const ghostRecord = await getRun(Number(ghostRunningId));
                ghostRecordRef.current = ghostRecord;
            }
        })();
    }, [courseId, initializeCourse, controls, isGhostRunning, ghostRunningId]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                return true;
            }
        );

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        if (isRestarting) {
            setIsFirst(false);
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
        if (context.status === "READY") {
            controls.oncourse();
        } else if (context.status === "COMPLETION_PENDING") {
            controls.extend();
        } else if (context.status === "PAUSED_USER") {
            controls.resume();
        } else if (context.status === "PAUSED_OFFCOURSE") {
            controls.oncourse();
        }
        setIsRestarting(false);
    }, [context.status, controls]);

    const segments = useMemo(
        () => selectPolylineSegments(context),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [context.telemetries, context.segments]
    );

    const statsForUI = useMemo(
        () => selectStatsDisplay(context),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            context.stats.totalDistanceM,
            context.stats.avgPaceSecPerKm,
            context.stats.currentPaceSecPerKm,
            context.stats.currentCadenceSpm,
            context.stats.bpm,
            context.stats.calories,
        ]
    );

    const [withRouting, setWithRouting] = useState<boolean>(false);

    const requestSave = useCallback(() => {
        if (isSaving) return;
        if (!context.telemetries.length) {
            router.back();
        }
        hasSavedRef.current = false;
        setSavingTelemetries(context.telemetries);
        setIsSaving(true);
        controls.stop();
    }, [isSaving, context.telemetries, controls, router]);

    // URI가 생기는 순간 저장 수행 (한 번만)
    useEffect(() => {
        if (!isSaving) return;
        if (!thumbnailUri) return; // 아직 캡처 안 됨
        if (hasSavedRef.current) return; // 중복 방지
        hasSavedRef.current = true;

        (async () => {
            try {
                const userRecordData = buildUserRecordData(context.stats);
                const response = await saveRunning({
                    telemetries: context.telemetries,
                    rawData: extractRawData(context.mainTimeline),
                    thumbnailUri,
                    userDashboardData: userRecordData,
                    runTime: Math.round(context.stats.totalTimeMs / 1000),
                    isPublic: false,
                });
                if (withRouting) {
                    router.replace({
                        pathname:
                            "/result/[runningId]/[courseId]/[ghostRunningId]",
                        params: {
                            runningId: response.runningId.toString(),
                            courseId: "-1",
                            ghostRunningId: "-1",
                        },
                    });
                }
            } catch {
                Toast.show({
                    type: "info",
                    text1: "기록 저장에 실패했습니다. 다시 시도해주세요.",
                    position: "bottom",
                    bottomOffset: 60,
                });
            } finally {
                setIsSaving(false);
                setThumbnailUri(null);
                setSavingTelemetries([]);
            }
        })();
    }, [
        withRouting,
        isSaving,
        thumbnailUri,
        context.telemetries,
        context.mainTimeline,
        router,
        controls,
        context.stats,
    ]);

    const now = useNow(
        context.status === "RUNNING" ||
            context.status === "RUNNING_EXTENDED" ||
            context.status === "PAUSED_USER" ||
            context.status === "PAUSED_OFFCOURSE"
    );
    const elapsedMs = getElapsedMs(
        context.liveActivity.startedAtMs ?? 0,
        context.liveActivity.pausedAtMs ?? null,
        now
    );

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            {isSaving && (
                <>
                    <LoadingLayer
                        limitDelay={3000}
                        onDelayed={triggerCapture}
                    />
                    {savingTelemetries.length > 0 && (
                        <RunShot
                            ref={runShotRef}
                            fileName={"runImage.jpg"}
                            telemetries={savingTelemetries}
                            type="thumbnail"
                            onMapReady={triggerCapture}
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
                        style={[
                            styles.timeText,
                            {
                                color:
                                    context.status === "READY" ||
                                    context.status === "PAUSED_OFFCOURSE"
                                        ? colors.red
                                        : context.status ===
                                          "COMPLETION_PENDING"
                                        ? colors.primary
                                        : colors.white,
                            },
                        ]}
                        entering={FadeIn.duration(1000)}
                    >
                        {context.status === "READY"
                            ? "3"
                            : getRunTime(Math.round(elapsedMs / 1000), "MM:SS")}
                    </Animated.Text>
                )}
            </TopBlurView>
            <MapViewWrapper controlPannelPosition={controlPannelPosition}>
                {segments.map((segment, index) => (
                    <RunningLine
                        key={segment.id ?? String(index)}
                        id={segment.id ?? String(index)}
                        segment={segment}
                        color={segment.isRunning ? "green" : "red"}
                    />
                ))}
                {courseSegments && (
                    <RunningLine id="course" segment={courseSegments} />
                )}
                {offcourseAnchor && (
                    <ShapeSource
                        id="custom-puck"
                        shape={{
                            type: "Point",
                            coordinates: [
                                offcourseAnchor.lng,
                                offcourseAnchor.lat,
                            ],
                        }}
                    >
                        <SymbolLayer
                            id="custom-puck-layer"
                            style={{
                                iconImage: "puck2",
                                iconAllowOverlap: true,
                            }}
                            aboveLayerID="layer-course"
                        />
                    </ShapeSource>
                )}
                {isGhostRunning && ghostCoordinator?.ghostPoint && (
                    <ShapeSource
                        id="ghost-puck"
                        shape={{
                            type: "Point",
                            coordinates: [
                                ghostCoordinator.ghostPoint.lng,
                                ghostCoordinator.ghostPoint.lat,
                            ],
                        }}
                    >
                        <SymbolLayer
                            id="ghost-puck-layer"
                            style={{
                                iconImage: "puck3",
                                iconAllowOverlap: true,
                            }}
                            aboveLayerID="layer-course"
                        />
                    </ShapeSource>
                )}
                {isGhostRunning &&
                    ghostCoordinator?.ghostSegments &&
                    ghostCoordinator.ghostSegments
                        .filter((segment) => segment.isRunning)
                        .map((segment, index) => (
                            <RunningLine
                                key={"ghost-segment-" + index}
                                id={"ghost-segment-" + index}
                                segment={segment}
                                color="red"
                                belowLayerID={"layer-" + segments[0].id}
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
                                description={
                                    isRestarting
                                        ? `러닝을 도중에 정지할 경우\n코스 및 러닝 기록 공개가 불가능합니다`
                                        : `러닝 기록을 위해\n코스 시작 지점으로 이동해 주세요`
                                }
                                iconColor={colors.red}
                                fontSize="headline"
                                fontColor="white"
                            />
                        ) : (
                            <StatsIndicator
                                stats={statsForUI}
                                color="gray20"
                                ghost={isGhostRunning}
                                ghostTelemetry={ghostCoordinator?.ghostPoint}
                            />
                        )}
                    </View>
                </BottomSheetView>
            </BottomSheet>
            {context.status === "RUNNING" ||
            context.status === "RUNNING_EXTENDED" ? (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        controls.pauseUser();
                    }}
                    color="red"
                    direction="right"
                />
            ) : context.status === "PAUSED_OFFCOURSE" ? (
                <SlideToDualAction
                    leftLabel={
                        context.stats.totalDistanceM < 500
                            ? "나가기"
                            : "러닝 종료"
                    }
                    rightLabel="일반 러닝 전환"
                    onSlideLeft={() => {
                        setWithRouting(true);
                        requestSave();
                    }}
                    onSlideRight={() => {
                        controls.extend();
                        Toast.show({
                            type: "info",
                            text1: "일반 러닝으로 전환합니다",
                            position: "bottom",
                            bottomOffset: 60,
                        });
                    }}
                    color="primary"
                />
            ) : context.status === "PAUSED_USER" ? (
                <SlideToDualAction
                    leftLabel={
                        context.stats.totalDistanceM < 500
                            ? "나가기"
                            : "기록 저장"
                    }
                    rightLabel="이어서 뛰기"
                    onSlideLeft={() => {
                        setWithRouting(true);
                        requestSave();
                    }}
                    onSlideRight={() => {
                        controls.resume();
                    }}
                    color="primary"
                />
            ) : context.status === "COMPLETION_PENDING" ? (
                <SlideToDualAction
                    leftLabel="결과 및 랭킹"
                    rightLabel="이어서 뛰기"
                    onSlideLeft={() => {
                        setWithRouting(true);
                        requestSave();
                    }}
                    onSlideRight={() => {
                        setWithRouting(false);
                        requestSave();
                        setIsRestarting(true);
                    }}
                    color="primary"
                />
            ) : (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        router.back();
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
