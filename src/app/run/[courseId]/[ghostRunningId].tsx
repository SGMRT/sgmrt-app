import {
    getCourse,
    getPacemakerDetail,
    getRun,
    markPacemakerAsRun,
} from "@/src/apis";
import { PacemakerDetailResponse } from "@/src/apis/types/ghosty";
import { Telemetry } from "@/src/apis/types/run";
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
import { TextWithSub } from "@/src/components/ui/TextWithSub";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { Typography } from "@/src/components/ui/Typography";
import { useRunVoice } from "@/src/features/audio/useRunVoice";
import { useCourseProgress } from "@/src/features/course/hooks/useCourseProgress";
import { useGhostCoordinator } from "@/src/features/course/hooks/useGhostCoordinator";
import { usePacerByDistance } from "@/src/features/pacemaker/hooks/usePacemakerByDistance";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import { mapPacemakerToTelemety } from "@/src/features/pacemaker/utils/pacemakerTelemetry";
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
import { devLog } from "@/src/utils/devLog";
import {
    getDate,
    getFormattedPace,
    getRunName,
    getRunTime,
    saveRunning,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";
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
        ghostRunningId: number | undefined;
        courseId: number | undefined;
    } | null>(null);

    const { courseId, ghostRunningId, ghostyId } = useLocalSearchParams();

    const isGhostRunning = ghostRunningId !== "-1";
    const isGhostyRunning = !!ghostyId;

    const [courseSegments, setCourseSegments] = useState<Segment>();

    const ghostTelemetryRef = useRef<Telemetry[]>([]);
    const pacemakerDetailRef = useRef<PacemakerDetailResponse | null>(null);
    const hasSavedRef = useRef<boolean>(false);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const { context, controls } = useRunningSession();

    const { removeJob, findByCourseId } = usePacemakerQueue();

    useRunVoice(context);

    const { initializeCourse, offcourseAnchor, legIndex, legs } =
        useCourseProgress({
            context,
            controls,
            onStart: () => {
                if (context.status === "READY" || isFirst) {
                    devLog("restarting");
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
        ghostTelemetry: ghostTelemetryRef.current,
        myPoint: context.telemetries[context.telemetries.length - 1],
        myLegIndex: legIndex,
        timestamp: context.stats.totalTimeMs,
        controls,
        simulateSpeed: 1.0,
        enabled: isGhostRunning || isGhostyRunning,
    });

    const pacerInfo = usePacerByDistance({
        pacer: pacemakerDetailRef.current?.pacemakerResponse,
        currentDistM: context.stats.totalDistanceM,
        distanceScale: 1000,
        enabled: isGhostyRunning,
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
            if (isGhostyRunning) {
                const pacemakerDetail = await getPacemakerDetail(
                    Number(ghostyId)
                );

                const ghosty = mapPacemakerToTelemety({
                    pacemaker: pacemakerDetail?.pacemakerResponse,
                    telemetries: response.telemetries,
                });
                if (ghosty) {
                    pacemakerDetailRef.current = pacemakerDetail;
                    ghostTelemetryRef.current = ghosty.sample();
                }
            }

            initializeCourse(response.telemetries, response.courseCheckpoints);
            if (isGhostRunning) {
                const ghostRecord = await getRun(Number(ghostRunningId));
                ghostTelemetryRef.current = ghostRecord?.telemetries ?? [];
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

            devLog(targetPath);

            await FileSystem.copyAsync({
                from: uri ?? "",
                to: targetPath,
            });

            return targetPath;
        } catch (error) {
            devLog("captureMap error: ", error);
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
                value: Math.round(context.stats.avgCadenceSpm ?? 0),
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

    const queryClient = useQueryClient();

    // URI가 생기는 순간 저장 수행 (한 번만)
    useEffect(() => {
        if (!isSaving) return;
        if (!thumbnailUri) return; // 아직 캡처 안 됨
        if (hasSavedRef.current) return; // 중복 방지
        hasSavedRef.current = true;

        (async () => {
            try {
                const userRecordData = buildUserRecordData(context.stats);

                const saveGhostId = !isClearCourse
                    ? undefined
                    : Number(ghostRunningId) !== -1
                    ? Number(ghostRunningId)
                    : undefined;

                const saveCourseId = !isClearCourse
                    ? undefined
                    : Number(courseId);

                const response = await saveRunning({
                    telemetries: context.telemetries,
                    rawData: extractRawData(context.mainTimeline),
                    thumbnailUri,
                    userDashboardData: userRecordData,
                    runTime: Math.round(context.stats.totalTimeMs / 1000),
                    isPublic: true,
                    ghostRunningId: saveGhostId,
                    courseId: saveCourseId,
                });

                setRunSaveResult({
                    runningId: response.runningId,
                    courseId: saveCourseId,
                    ghostRunningId: saveGhostId,
                });

                if (ghostyId && response.runningId) {
                    await markPacemakerAsRun(
                        Number(ghostyId),
                        response.runningId
                    );
                    queryClient.invalidateQueries({
                        queryKey: ["pacemaker", Number(courseId)],
                    });
                    queryClient.invalidateQueries({
                        queryKey: ["pacemakerDetail", Number(ghostyId)],
                    });
                    const job = findByCourseId(Number(courseId));
                    if (job) {
                        removeJob(job.jobId);
                    }
                }

                if (withRouting) {
                    router.replace({
                        pathname:
                            "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                        params: {
                            runningId: response.runningId.toString(),
                            courseId: saveCourseId ?? "-1",
                            ghostRunningId: saveGhostId ?? "-1",
                        },
                    });
                }
                setThumbnailUri(null);
                if (!withRouting) setRunShotType("share");
            } catch (error) {
                showCompactToast(
                    "기록 저장에 실패했습니다. 다시 시도해주세요."
                );
                Sentry.captureException("기록 저장 실패: " + error);
            } finally {
                queryClient.invalidateQueries({
                    queryKey: ["runs"],
                });
                setIsSaving(false);
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
        queryClient,
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
                        distance={(context.stats.totalDistanceM / 1000).toFixed(
                            2
                        )}
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
                            : getRunTime(
                                  Math.round(elapsedMs / 1000),
                                  "HH:MM:SS_IF_HH_EXISTS"
                              )}
                    </Animated.Text>
                )}
            </TopBlurView>
            <MapViewWrapper
                controlPannelPosition={controlPannelPosition}
                zoom={16}
            >
                {segments.map((segment, index) => (
                    <RunningLine
                        key={segment.id ?? String(index)}
                        id={segment.id ?? String(index)}
                        segment={segment}
                        color={segment.isRunning ? "green" : "red"}
                        aboveLayerID="z-index-4"
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
                {(isGhostRunning || isGhostyRunning) &&
                    ghostCoordinator?.ghostPoint && (
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
                {(isGhostRunning || isGhostyRunning) &&
                    ghostCoordinator?.ghostSegments &&
                    ghostCoordinator.ghostSegments
                        .filter((segment) => segment.isRunning)
                        .map((segment, index) => (
                            <RunningLine
                                key={"ghost-segment-" + index}
                                id={"ghost-segment-" + index}
                                segment={segment}
                                color="red"
                                aboveLayerID="z-index-3"
                            />
                        ))}
            </MapViewWrapper>

            <StyledBottomSheet
                bottomInset={bottom + 70}
                animatedPosition={heightVal}
            >
                <View>
                    {isFirst || context.status === "PAUSED_OFFCOURSE" ? (
                        <View
                            style={{
                                alignItems: "center",
                                marginTop: 30,
                                marginBottom: 65,
                            }}
                        >
                            <Typography
                                variant="sectionhead"
                                color="white"
                                style={{ textAlign: "center" }}
                            >
                                {context.status !== "PAUSED_OFFCOURSE"
                                    ? `러닝 기록을 위해\n코스 시작 지점으로 이동해주세요`
                                    : `10분 뒤 자동 종료돼요\n러닝을 이어서 진행하기 위해\n이탈 지점으로 돌아가 주세요`}
                            </Typography>
                        </View>
                    ) : (
                        <View style={{ marginVertical: 30 }}>
                            {runShotType === "share" && (
                                <TextWithSub
                                    title={courseName}
                                    sub="완주한 기록은 내 기록에서 확인할 수 있어요."
                                    containerStyle={{ marginBottom: 30 }}
                                />
                            )}
                            <StatsIndicator
                                stats={statsForUI}
                                color="gray20"
                                ghost={isGhostRunning || isGhostyRunning}
                                ghostType={isGhostyRunning ? "ghosty" : "ghost"}
                                ghostTelemetry={ghostCoordinator?.ghostPoint}
                                targetPace={
                                    pacerInfo.currentPaceSecPerKm ?? undefined
                                }
                                end={runShotType === "share"}
                            />
                        </View>
                    )}
                </View>
            </StyledBottomSheet>

            {runShotType === "thumbnail" ? (
                <>
                    {context.status === "IDLE" ||
                    context.status === "READY" ||
                    context.status === "STOPPED" ||
                    context.status === "COMPLETION_PENDING" ? (
                        <Button
                            title="러닝 종료"
                            onPress={async () => {
                                controls.stop();
                                router.back();
                            }}
                            type="red"
                        />
                    ) : context.status === "RUNNING" ||
                      context.status === "RUNNING_EXTENDED" ? (
                        <ButtonWithIcon
                            iconType="quit"
                            onPressIcon={async () => {
                                Alert.alert(
                                    "러닝을 종료할까요?",
                                    "500m 이하의 러닝은 저장되지 않아요",
                                    [
                                        {
                                            text: "저장하기",
                                            style: "default",
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
                                        {
                                            text: "뒤로가기",
                                            style: "destructive",
                                        },
                                    ]
                                );
                            }}
                            title="일시정지"
                            onPress={async () => {
                                Alert.alert(
                                    "러닝을 일시정지할까요?",
                                    "일시정지 후 이어 달린 기록은 고스트가 생성되지 않아요",
                                    [
                                        {
                                            text: "계속러닝",
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
                    ) : context.status === "PAUSED_USER" ? (
                        <ButtonWithIcon
                            iconType="quit"
                            onPressIcon={async () => {
                                Alert.alert(
                                    "러닝을 종료할까요?",
                                    "500m 이하의 러닝은 저장되지 않아요",
                                    [
                                        {
                                            text: "저장하기",
                                            style: "default",
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
                                        {
                                            text: "뒤로가기",
                                            style: "destructive",
                                        },
                                    ]
                                );
                            }}
                            title="이어서 러닝"
                            onPress={async () => {
                                Alert.alert(
                                    "러닝을 이어서 시작할까요?",
                                    "계속러닝을 누르면 이어서 러닝이 가능해요",
                                    [
                                        { text: "취소", style: "default" },
                                        {
                                            text: "계속러닝",
                                            style: "destructive",
                                            onPress: () => {
                                                controls.resume();
                                            },
                                        },
                                    ]
                                );
                            }}
                            type="active"
                        />
                    ) : context.status === "PAUSED_OFFCOURSE" ? (
                        <Button
                            title="러닝 종료"
                            onPress={async () => {
                                Alert.alert(
                                    "러닝을 종료할까요?",
                                    "500m 이하의 러닝은 저장되지 않아요",
                                    [
                                        {
                                            text: "저장하기",
                                            style: "default",
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
                                        {
                                            text: "뒤로가기",
                                            style: "destructive",
                                        },
                                    ]
                                );
                            }}
                            type="red"
                        />
                    ) : null}
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
                                    devLog(res);
                                    // run_shared
                                    trackAmplitude("Run Shared");
                                })
                                .catch((err) => {
                                    err && devLog(err);
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
                                            runSaveResult.courseId?.toString() ??
                                            "-1",
                                        ghostRunningId:
                                            runSaveResult.ghostRunningId?.toString() ??
                                            "-1",
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
