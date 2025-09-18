import { Telemetry } from "@/src/apis/types/run";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import RunningLine from "@/src/components/map/RunningLine";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import RunShot, { RunShotHandle } from "@/src/components/shot/RunShot";
import { Button } from "@/src/components/ui/Button";
import ButtonWithIcon from "@/src/components/ui/ButtonWithMap";
import Countdown from "@/src/components/ui/Countdown";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useRunVoice } from "@/src/features/audio/useRunVoice";
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
import { getRunTime, saveRunning } from "@/src/utils/runUtils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Run() {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const runShotRef = useRef<RunShotHandle>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

    const { context, controls } = useRunningSession();

    useRunVoice(context);

    const hasSavedRef = useRef<boolean>(false);

    const triggerCapture = useCallback(() => {
        runShotRef.current
            ?.capture()
            .then((uri) => setThumbnailUri(uri))
            .catch(() => setThumbnailUri(""));
    }, []);

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
            controls.start("SOLO");
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
            } catch {
                showCompactToast(
                    "기록 저장에 실패했습니다. 다시 시도해주세요."
                );
            } finally {
                setIsSaving(false);
                setThumbnailUri(null);
                setSavingTelemetries([]);
            }
        })();
    }, [
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
                        {getRunTime(Math.round(elapsedMs / 1000), "MM:SS")}
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
                <Button
                    disabled={
                        context.status === "READY" || context.status === "IDLE"
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
                    onPressIcon={() => {
                        Alert.alert(
                            "러닝을 종료하시겠습니까?",
                            "500m 이하의 러닝은 저장되지 않습니다.",
                            [
                                { text: "계속하기", style: "default" },
                                {
                                    text:
                                        context.stats.totalDistanceM < 500
                                            ? "나가기"
                                            : "기록 저장",
                                    style: "destructive",
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
                            ]
                        );
                    }}
                    title="이어서 러닝"
                    onPress={() => {
                        controls.resume();
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
