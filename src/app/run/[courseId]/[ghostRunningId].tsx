import { getCourse, getPacemakerDetail, getRun } from "@/src/apis";
import { queryKeys } from "@/src/apis/queryKeys";
import { PacemakerDetailResponse } from "@/src/apis/types/ghosty";
import { Telemetry } from "@/src/apis/types/run";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine, { Segment } from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot from "@/src/components/share/RunShot";
import { ShareBottomSheet } from "@/src/components/share/ShareBottomSheet";
import { ShareVariant } from "@/src/components/share/types";
import Countdown from "@/src/components/ui/Countdown";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import StyledBottomSheet from "@/src/components/ui/StyledBottomSheet";
import { showCompactToast, showToast } from "@/src/components/ui/toastConfig";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { Typography } from "@/src/components/ui/Typography";
import { useRunVoice } from "@/src/features/audio/useRunVoice";
import { useCourseProgress } from "@/src/features/course/hooks/useCourseProgress";
import { useGhostCoordinator } from "@/src/features/course/hooks/useGhostCoordinator";
import { usePacerByDistance } from "@/src/features/pacemaker/hooks/usePacemakerByDistance";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import { mapPacemakerToTelemety } from "@/src/features/pacemaker/utils/pacemakerTelemetry";
import ReplayRecoder, {
    ReplayRecorderHandle,
} from "@/src/features/replay/ReplayRecoder";
import RunControlButtons from "@/src/features/run/components/RunControlButtons";
import RunStatsPanel from "@/src/features/run/components/RunStatsPanel";
import { useNow } from "@/src/features/run/hooks/useNow";
import { useRunningSession } from "@/src/features/run/hooks/useRunningSession";
import { useRunSaveFlow } from "@/src/features/run/hooks/useRunSaveFlow";
import {
    selectPolylineSegments,
    selectStatsDisplay,
} from "@/src/features/run/state/selectors";
import { getElapsedMs } from "@/src/features/run/state/time";
import colors from "@/src/theme/colors";
import { devLog } from "@/src/utils/devLog";
import {
    getDate,
    getFormattedPace,
    getRunName,
    getRunTime,
    telemetriesToSegment,
} from "@/src/utils/runUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Share from "react-native-share";
import { ShareVariantWithVideo } from "../../(tabs)/stats/result/[runningId]/[courseId]/[ghostRunningId]";

export default function Run() {
    const { bottom } = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [courseName, setCourseName] = useState("");
    const [isRestarting, setIsRestarting] = useState(false);
    const [isFirst, setIsFirst] = useState(true);
    const [isClearCourse, setIsClearCourse] = useState(false);
    const [runShotVariant, setRunShotVariant] = useState<ShareVariantWithVideo>(
        "default" as ShareVariantWithVideo
    );
    const [replayProgress, setReplayProgress] = useState(-1);

    const { courseId, ghostRunningId, ghostyId } = useLocalSearchParams();
    const isGhostRunning = ghostRunningId !== "-1";
    const isGhostyRunning = !!ghostyId;

    const [courseSegments, setCourseSegments] = useState<Segment>();
    const ghostTelemetryRef = useRef<Telemetry[]>([]);
    const pacemakerDetailRef = useRef<PacemakerDetailResponse | null>(null);
    const shareBottomSheetRef = useRef<BottomSheetModal>(null);
    const replayRecoderRef = useRef<ReplayRecorderHandle>(null);

    const { context, controls } = useRunningSession();
    const { removeJob, findByCourseId } = usePacemakerQueue();

    const {
        isSaving,
        savingTelemetries,
        runShotType,
        runSaveResult,
        runShotRef,
        requestSave,
        triggerCapture,
        setWithRouting,
        setRunShotType,
        captureMap,
    } = useRunSaveFlow({
        context,
        controls,
        courseId,
        ghostRunningId,
        ghostyId,
        isClearCourse,
        findByCourseId,
        removeJob,
    });

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

    // 코스 및 고스트 데이터 초기화
    useEffect(() => {
        (async () => {
            const response = await getCourse(Number(courseId));
            setCourseName(response.name);
            setCourseSegments(telemetriesToSegment(response.telemetries, 0)[1]);
            const userInfo = queryClient.getQueryData<GetUserInfoResponse>(
                queryKeys.user.info()
            );
            controls.start(
                "COURSE",
                isGhostRunning ? "GHOST" : "PLAIN",
                { distanceMeters: response.distance },
                userInfo?.weight ?? undefined
            );
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
    }, [
        courseId,
        initializeCourse,
        controls,
        isGhostRunning,
        ghostRunningId,
        queryClient,
        ghostyId,
        isGhostyRunning,
    ]);

    // 뒤로가기 버튼 차단
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => true
        );
        return () => backHandler.remove();
    }, []);

    // 재시작 토스트
    useEffect(() => {
        if (isRestarting) {
            setIsFirst(false);
            showCompactToast("3초 뒤 러닝이 시작됩니다.");
        }
    }, [isRestarting]);

    // 완주 시 자동 저장
    useEffect(() => {
        if (context.status === "COMPLETION_PENDING") {
            setIsClearCourse(true);
            requestSave();
            setWithRouting(false);
        }
    }, [context.status, requestSave, setWithRouting]);

    const heightVal = useSharedValue(0);
    const controlPannelPosition = useAnimatedStyle(() => ({
        top: heightVal.value - 64,
    }));

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

    const captureStats = useMemo(
        () => [
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
                description: "케이던스(spm)",
                value:
                    (context.stats.avgCadenceSpm ?? 0) > 0
                        ? Math.round(context.stats.avgCadenceSpm ?? 0)
                        : "--",
            },
            {
                description: "칼로리(kcal)",
                value: context.stats.calories ?? 0,
            },
            {
                description: "평균 심박수",
                value: context.stats.bpm ?? "--",
            },
            {
                description: "고도 상승",
                value: (context.stats.gainM ?? 0).toString() + "m",
            },
        ],
        [context.stats]
    );

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

    // 공유 관련 핸들러
    const showShareBottomSheet = () => shareBottomSheetRef.current?.present();
    const handleShareBottomSheetSelect = (variant: ShareVariantWithVideo) =>
        setRunShotVariant(variant);

    async function handleShareVideo() {
        try {
            shareBottomSheetRef.current?.dismiss();
            replayRecoderRef.current?.reset();
            setReplayProgress(-1);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await replayRecoderRef.current?.startRecording();
        } catch {
            showToast("info", "공유에 실패했습니다", bottom);
            setReplayProgress(-1);
        }
    }

    const handleShare = async () => {
        if (runShotVariant !== "video") {
            const uri = await captureMap();
            Share.open({
                title: getRunName(context.telemetries.at(-1)?.timeStamp ?? 0),
                message: getDate(
                    context.telemetries.at(-1)?.timeStamp ?? 0
                ).trim(),
                filename:
                    "ghostrunner_" + runSaveResult?.runningId.toString() + ".png",
                url: uri ?? "",
            })
                .then(() => trackAmplitude("Run Shared"))
                .catch(() => {});
            shareBottomSheetRef.current?.dismiss();
        } else {
            Alert.alert(
                "실험 기능 안내",
                "이 기능은 현재 실험 중인 기능입니다.\n처리 과정에 다소 시간이 소요될 수 있으며, 실행 중에도 언제든 취소하실 수 있습니다.\n계속 진행하시겠습니까?",
                [
                    { text: "취소", style: "cancel" },
                    {
                        text: "계속 진행",
                        style: "default",
                        onPress: handleShareVideo,
                    },
                ]
            );
        }
    };

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            {/* 로딩 및 캡처 레이어 */}
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
                        fileName="runImage.png"
                        telemetries={savingTelemetries}
                        type={runShotType}
                        onMapReady={triggerCapture}
                        stats={runShotType === "share" ? captureStats : undefined}
                        distance={(context.stats.totalDistanceM / 1000).toFixed(2)}
                        variant={runShotVariant as ShareVariant}
                    />
                )}

            {/* 비디오 리플레이 */}
            {runShotVariant === "video" && (
                <ReplayRecoder
                    ref={replayRecoderRef}
                    telemetries={savingTelemetries}
                    visualFps={60}
                    width={360}
                    height={350}
                    autoShare={true}
                    name={getRunName(savingTelemetries.at(-1)?.timeStamp ?? 0)}
                    distance={(context.stats.totalDistanceM / 1000).toFixed(2)}
                    stats={captureStats}
                    onProgress={setReplayProgress}
                    onFinish={() => setReplayProgress(-1)}
                />
            )}
            {replayProgress >= 0 && runShotVariant === "video" && (
                <LoadingLayer progress={replayProgress}>
                    <Pressable onPress={() => replayRecoderRef.current?.reset()}>
                        <Typography variant="body3" color="gray40">
                            취소하기
                        </Typography>
                    </Pressable>
                </LoadingLayer>
            )}

            {/* 공유 바텀시트 */}
            <ShareBottomSheet
                bottomSheetRef={shareBottomSheetRef}
                selected={runShotVariant}
                onSelect={handleShareBottomSheetSelect}
                onShare={handleShare}
            />

            {/* 상단 타이머 */}
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
                                        : context.status === "COMPLETION_PENDING"
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

            {/* 지도 */}
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
                            coordinates: [offcourseAnchor.lng, offcourseAnchor.lat],
                        }}
                    >
                        <SymbolLayer
                            id="custom-puck-layer"
                            style={{ iconImage: "puck2", iconAllowOverlap: true }}
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
                                style={{ iconImage: "puck3", iconAllowOverlap: true }}
                                aboveLayerID="z-index-5"
                            />
                        </ShapeSource>
                    )}
                {(isGhostRunning || isGhostyRunning) &&
                    ghostCoordinator?.ghostSegments
                        ?.filter((segment) => segment.isRunning)
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

            {/* 하단 스탯 패널 */}
            <StyledBottomSheet
                bottomInset={bottom + 70}
                animatedPosition={heightVal}
            >
                <RunStatsPanel
                    status={context.status}
                    runShotType={runShotType}
                    isFirst={isFirst}
                    courseName={courseName}
                    statsForUI={statsForUI}
                    isGhostRunning={isGhostRunning}
                    isGhostyRunning={isGhostyRunning}
                    ghostPoint={ghostCoordinator?.ghostPoint}
                    targetPace={pacerInfo.currentPaceSecPerKm ?? undefined}
                />
            </StyledBottomSheet>

            {/* 컨트롤 버튼 */}
            <RunControlButtons
                status={context.status}
                runShotType={runShotType}
                totalDistanceM={context.stats.totalDistanceM}
                runSaveResult={runSaveResult}
                onStop={controls.stop}
                onPauseUser={controls.pauseUser}
                onResume={controls.resume}
                onRequestSave={requestSave}
                onShowShareBottomSheet={showShareBottomSheet}
            />
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
