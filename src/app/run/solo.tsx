import { queryKeys } from "@/src/apis/queryKeys";
import { Telemetry } from "@/src/apis/types/run";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShotHandle } from "@/src/components/share/RunShot";
import { ButtonWithMap, Countdown, LoadingLayer, StatsIndicator, TopBlurView, showCompactToast } from "@/src/components/ui";
import { useRunVoice } from "@/src/features/audio/useRunVoice";
import { useNow } from "@/src/features/run/hooks/useNow";
import { useRunningSession } from "@/src/features/run/hooks/useRunningSession";
import { buildUserRecordData } from "@/src/features/run/context/record";
import {
    selectPolylineSegments,
    selectStatsDisplay,
} from "@/src/features/run/context/selectors";
import { getElapsedMs } from "@/src/features/run/context/time";
import { extractRawData } from "@/src/features/run/utils/extractRawData";
import colors from "@/src/theme/colors";
import { getRunTime, saveRunning } from "@/src/utils/runUtils";
import { SaveRunningError } from "@/src/utils/runUtils/saveRunning";
import { captureError } from "@/src/utils/sentryTools";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CAPTURE_TIMEOUT_MS = 10000;

export default function Run() {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isRestarting, setIsRestarting] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const runShotRef = useRef<RunShotHandle>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

    const { context, controls } = useRunningSession();

    useRunVoice(context);

    const hasSavedRef = useRef<boolean>(false);
    const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // "IDLE" = 캡처 시도 안함, "PENDING" = 캡처 중, "DONE" = 캡처 완료/실패
    const [captureState, setCaptureState] = useState<"IDLE" | "PENDING" | "DONE">("IDLE");

    const triggerCapture = useCallback(() => {
        // 이미 캡처 중이거나 완료된 경우 무시
        if (captureState !== "IDLE") return;
        setCaptureState("PENDING");

        // 타임아웃 설정: 캡처가 너무 오래 걸리면 실패 처리
        captureTimeoutRef.current = setTimeout(() => {
            captureError("run.solo.captureTimeout", new Error("Capture timeout"));
            setThumbnailUri(null);
            setCaptureState("DONE");
        }, CAPTURE_TIMEOUT_MS);

        runShotRef.current
            ?.capture()
            .then((uri) => {
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
                setThumbnailUri(uri || null);
                setCaptureState("DONE");
            })
            .catch((error) => {
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
                captureError("run.solo.capture", error);
                // 캡처 실패해도 저장은 진행 (썸네일 없이)
                setThumbnailUri(null);
                setCaptureState("DONE");
            });
    }, [captureState]);

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
        if (context.status === "IDLE") {
            const userInfo = queryClient.getQueryData<GetUserInfoResponse>(
                queryKeys.user.info()
            );
            controls.start("SOLO", undefined, undefined, userInfo?.weight ?? undefined);
        } else if (context.status === "COMPLETION_PENDING") {
            controls.extend();
        } else if (context.status === "PAUSED_USER") {
            controls.resume();
        } else if (context.status === "PAUSED_OFFCOURSE") {
            controls.oncourse();
        }
        setIsRestarting(false);
    }, [context.status, controls, queryClient]);

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

    const requestSave = useCallback(() => {
        if (isSaving) return;
        if (!context.telemetries.length) {
            showCompactToast("저장할 러닝 데이터가 없습니다");
            return;
        }
        hasSavedRef.current = false;
        setSavingTelemetries(context.telemetries);
        setIsSaving(true);
        controls.stop();
    }, [isSaving, context.telemetries, controls]);

    // 캡처 완료(성공/실패) 시 저장 수행
    useEffect(() => {
        if (!isSaving) return;
        if (captureState !== "DONE") return; // 캡처 완료 대기
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
                });
                router.replace({
                    pathname:
                        "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                    params: {
                        runningId: response.runningId.toString(),
                        courseId: "-1",
                        ghostRunningId: "-1",
                    },
                });
            } catch (error: unknown) {
                if (error instanceof SaveRunningError) {
                    showCompactToast(error.message);
                } else {
                    showCompactToast(
                        "기록 저장에 실패했습니다. 다시 시도해주세요."
                    );
                }
                captureError("run.solo.saveRunning", error as Error);
                // 저장 실패 시 재시도 가능하도록 상태 초기화
                hasSavedRef.current = false;
            } finally {
                queryClient.invalidateQueries({
                    queryKey: ["runs"],
                });
                setIsSaving(false);
                setThumbnailUri(null);
                setSavingTelemetries([]);
                setCaptureState("IDLE");
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
            }
        })();
    }, [
        isSaving,
        captureState,
        thumbnailUri,
        context.telemetries,
        context.mainTimeline,
        router,
        queryClient,
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
                            title={""}
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
                        style={[styles.timeText, { color: colors.white }]}
                        entering={FadeIn.duration(1000)}
                    >
                        {getRunTime(
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
                    />
                ))}
            </MapViewWrapper>

            <BottomSheet
                backgroundStyle={styles.container}
                bottomInset={bottom + 70}
                handleStyle={styles.handle}
                handleIndicatorStyle={styles.handleIndicator}
                snapPoints={[15]}
                index={1}
                animatedPosition={heightVal}
            >
                <BottomSheetView>
                    <View style={styles.bottomSheetContent}>
                        <StatsIndicator stats={statsForUI} color="gray20" />
                    </View>
                </BottomSheetView>
            </BottomSheet>

            {context.status !== "PAUSED_USER" ? (
                <ButtonWithMap
                    iconType="save"
                    disabled={
                        context.status === "READY" || context.status === "IDLE"
                    }
                    title="일시정지"
                    onPressIcon={() => {
                        Alert.alert(
                            "러닝을 저장할까요?",
                            "500m 이하의 러닝은 저장되지 않아요",
                            [
                                {
                                    text: "저장하기",
                                    style: "default",
                                    onPress: () => {
                                        if (
                                            context.stats.totalDistanceM < 500
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
                    onPress={() => {
                        Alert.alert(
                            "러닝을 일시정지할까요?",
                            "계속러닝을 누르면 이어서 러닝이 가능해요",
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
                />
            ) : (
                <ButtonWithMap
                    iconType="save"
                    onPressIcon={() => {
                        Alert.alert(
                            "러닝을 저장할까요?",
                            "500m 이하의 러닝은 저장되지 않아요",
                            [
                                {
                                    text: "저장하기",
                                    style: "default",
                                    onPress: () => {
                                        if (
                                            context.stats.totalDistanceM < 500
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
                    onPress={() => {
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
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
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
