import { getCourse, getRun } from "@/src/apis";
import { SoloRunGetResponse, Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine, { Segment } from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShotHandle } from "@/src/components/shot/RunShot";
import { Button } from "@/src/components/ui/Button";
import ButtonWithIcon from "@/src/components/ui/ButtonWithMap";
import Countdown from "@/src/components/ui/Countdown";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import StyledBottomSheet from "@/src/components/ui/StyledBottomSheet";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { Typography } from "@/src/components/ui/Typography";
import { useRunMetronome } from "@/src/features/audio/useRunMetronome";
import { useRunVoice } from "@/src/features/audio/useRunVoice";
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
import colors from "@/src/theme/colors";
import {
    getDate,
    getFormattedPace,
    getRunName,
    getRunTime,
    saveRunning,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    BackHandler,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Confetti } from "react-native-fast-confetti";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Share from "react-native-share";

export default function Run() {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [courseName, setCourseName] = useState<string>("");
    const [isRestarting, setIsRestarting] = useState<boolean>(false);
    const [isFirst, setIsFirst] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const [isClearCourse, setIsClearCourse] = useState<boolean>(false);
    const runShotRef = useRef<RunShotHandle>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
    const [runShotType, setRunShotType] = useState<"thumbnail" | "share">(
        "thumbnail"
    );
    const [runSaveResult, setRunSaveResult] = useState<{
        runningId: number;
        ghostRunningId: number;
        courseId: number;
    } | null>(null);

    const { courseId, ghostRunningId } = useLocalSearchParams();
    const isGhostRunning = ghostRunningId !== "-1";
    const [courseSegments, setCourseSegments] = useState<Segment>();

    const ghostRecordRef = useRef<SoloRunGetResponse | null>(null);
    const hasSavedRef = useRef<boolean>(false);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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
                    setIsClearCourse(false);
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
        controls,
        simulateSpeed: 1.5,
    });

    useRunMetronome({
        enabled: context.variant === "GHOST" && context.status === "RUNNING",
        baseBpm: context.stats.avgCadenceSpm ?? 120,
        deltaM: -(ghostCoordinator?.deltaM ?? 0),
    });

    const triggerCapture = useCallback(() => {
        runShotRef.current
            ?.capture()
            .then((uri) => setThumbnailUri(uri))
            .catch(() => setThumbnailUri(""));
    }, []);

    useEffect(() => {
        (async () => {
            const response = await getCourse(Number(courseId));
            setCourseName(response.name);
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
            showCompactToast("3초 뒤 러닝이 시작됩니다.");
        }
    }, [isRestarting]);

    const heightVal = useSharedValue(0);

    const controlPannelPosition = useAnimatedStyle(() => {
        return {
            top: heightVal.value - 64,
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
            context.stats.currentPaceSecPerKm,
            context.stats.currentCadenceSpm,
            context.stats.avgPaceSecPerKm,
            context.stats.calories,
            context.stats.bpm,
        ]
    );

    const [withRouting, setWithRouting] = useState<boolean>(false);

    const captureMap = useCallback(async () => {
        try {
            const uri = await runShotRef.current?.capture?.().then((uri) => {
                return uri;
            });

            const filename =
                getRunName(context.telemetries.at(-1)?.timeStamp ?? 0) + ".jpg";
            const targetPath = `${FileSystem.cacheDirectory}${filename}`;

            console.log(targetPath);

            await FileSystem.copyAsync({
                from: uri ?? "",
                to: targetPath,
            });

            return targetPath;
        } catch (error) {
            console.log("captureMap error: ", error);
            return null;
        }
    }, [context.telemetries]);

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

    const captureStats = useMemo(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    Math.round(context.stats.totalTimeMs / 1000),
                    "HH:MM:SS"
                ),
            },
            {
                description: "평균 페이스",
                value: getFormattedPace(context.stats.avgPaceSecPerKm ?? 0),
            },
            {
                description: "케이던스",
                value: context.stats.avgCadenceSpm ?? 0,
                unit: "spm",
            },
            {
                description: "칼로리",
                value: context.stats.calories ?? 0,
                unit: "kcal",
            },
        ];
    }, [context.stats]);

    useEffect(() => {
        if (context.status === "COMPLETION_PENDING") {
            setIsClearCourse(true);
            requestSave();
            setWithRouting(false);
        }
    }, [context.status, requestSave]);

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
                    isPublic: true,
                    ghostRunningId: !isClearCourse
                        ? null
                        : Number(ghostRunningId) !== -1
                        ? Number(ghostRunningId)
                        : null,
                });
                setRunSaveResult({
                    runningId: response.runningId,
                    courseId: Number(courseId),
                    ghostRunningId: Number(ghostRunningId),
                });
                if (withRouting) {
                    router.replace({
                        pathname:
                            "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                        params: {
                            runningId: response.runningId.toString(),
                            courseId: courseId.toString(),
                            ghostRunningId: ghostRunningId.toString(),
                        },
                    });
                }
            } catch {
                showCompactToast(
                    "기록 저장에 실패했습니다. 다시 시도해주세요."
                );
            } finally {
                setIsSaving(false);
                setThumbnailUri(null);
                setRunShotType("share");
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
        ghostRunningId,
        courseId,
        isClearCourse,
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
                <LoadingLayer limitDelay={3000} onDelayed={triggerCapture} />
            )}
            {(isSaving || runShotType === "share") &&
                savingTelemetries.length > 0 && (
                    <RunShot
                        ref={runShotRef}
                        title={getRunName(
                            savingTelemetries.at(0)?.timeStamp ?? 0
                        )}
                        fileName={"runImage.jpg"}
                        telemetries={savingTelemetries}
                        type={runShotType}
                        onMapReady={triggerCapture}
                        stats={
                            runShotType === "share" ? captureStats : undefined
                        }
                        distance={context.stats.totalDistanceM.toFixed(2)}
                    />
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
                        aboveLayerID="z-index-3"
                    />
                ))}
                {courseSegments && (
                    <RunningLine
                        id="course"
                        segment={courseSegments}
                        aboveLayerID="z-index-1"
                    />
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
                            aboveLayerID="z-index-6"
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
                            aboveLayerID="z-index-5"
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
                                aboveLayerID="z-index-2"
                            />
                        ))}
            </MapViewWrapper>

            <StyledBottomSheet animatedPosition={heightVal}>
                <View>
                    {isFirst ? (
                        <View
                            style={{
                                alignItems: "center",
                                marginTop: 30,
                                marginBottom: 65,
                            }}
                        >
                            <Typography variant="sectionhead" color="white">
                                러닝 기록을 위해
                            </Typography>
                            <Typography variant="sectionhead" color="white">
                                코스 시작 지점으로 이동해 주세요
                            </Typography>
                        </View>
                    ) : (
                        <View style={{ marginVertical: 30 }}>
                            {runShotType === "share" && (
                                <View
                                    style={{
                                        marginBottom: 30,
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <Typography
                                        variant="sectionhead"
                                        color="white"
                                    >
                                        {courseName} 완주에 성공했어요!
                                    </Typography>
                                    <Typography variant="body3" color="gray40">
                                        달린 기록은 자동 저장됩니다
                                    </Typography>
                                </View>
                            )}
                            <StatsIndicator
                                stats={statsForUI}
                                color="gray20"
                                ghost={isGhostRunning}
                                ghostTelemetry={ghostCoordinator?.ghostPoint}
                                end={runShotType === "share"}
                            />
                        </View>
                    )}
                </View>
            </StyledBottomSheet>
            {runShotType === "thumbnail" ? (
                <>
                    {context.status !== "PAUSED_USER" &&
                    context.status !== "PAUSED_OFFCOURSE" ? (
                        <Button
                            disabled={
                                context.status === "READY" ||
                                context.status === "IDLE"
                            }
                            title="일시정지"
                            onPress={() => {
                                Alert.alert(
                                    "러닝을 일시정지하시겠습니까?",
                                    "계속하기를 누르면 이어서 러닝이 가능합니다.",
                                    [
                                        {
                                            text: "계속하기",
                                            style: "default",
                                        },
                                        {
                                            text: "일시정지",
                                            style: "destructive",
                                            onPress: () => {
                                                controls.pauseUser();
                                            },
                                        },
                                    ]
                                );
                            }}
                            type="red"
                        />
                    ) : (
                        <ButtonWithIcon
                            iconType="save"
                            disabled={context.status === "PAUSED_OFFCOURSE"}
                            onPressIcon={() => {
                                Alert.alert(
                                    "러닝을 종료하시겠습니까?",
                                    "500m 이하의 러닝은 저장되지 않습니다.",
                                    [
                                        { text: "계속하기", style: "default" },
                                        {
                                            text:
                                                context.stats.totalDistanceM <
                                                500
                                                    ? "나가기"
                                                    : "기록 저장",
                                            style: "destructive",
                                            onPress: () => {
                                                if (
                                                    context.stats
                                                        .totalDistanceM < 500
                                                ) {
                                                    controls.stop();
                                                    router.back();
                                                } else {
                                                    requestSave();
                                                }
                                            },
                                        },
                                    ]
                                );
                            }}
                            title="이어서 러닝"
                            onPress={() => {
                                controls.resume();
                            }}
                        />
                    )}
                </>
            ) : (
                <>
                    <Confetti
                        fallDuration={4000}
                        count={100}
                        colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
                        flakeSize={{ width: 12, height: 8 }}
                        fadeOutOnEnd={true}
                        cannonsPositions={[
                            { x: windowWidth / 2, y: windowHeight - 440 },
                            { x: windowWidth / 2, y: windowHeight - 440 },
                        ]}
                        blastDuration={800}
                        autoplay={true}
                        isInfinite={false}
                    />
                    <ButtonWithIcon
                        iconType="share"
                        title="러닝 종료"
                        onPressIcon={async () => {
                            const uri = await captureMap();
                            Share.open({
                                title: getRunName(
                                    context.telemetries.at(-1)?.timeStamp ?? 0
                                ),
                                message: getDate(
                                    context.telemetries.at(-1)?.timeStamp ?? 0
                                ).trim(),
                                filename:
                                    "ghostrunner_" +
                                    runSaveResult?.runningId.toString() +
                                    ".jpg",
                                url: uri ?? "",
                            })
                                .then((res) => {
                                    console.log(res);
                                })
                                .catch((err) => {
                                    err && console.log(err);
                                });
                        }}
                        onPress={() => {
                            if (runSaveResult) {
                                router.replace({
                                    pathname:
                                        "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                                    params: {
                                        runningId:
                                            runSaveResult.runningId.toString(),
                                        courseId:
                                            runSaveResult.courseId.toString(),
                                        ghostRunningId:
                                            runSaveResult.ghostRunningId.toString(),
                                    },
                                });
                            }
                        }}
                        type="active"
                    />
                </>
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
});
