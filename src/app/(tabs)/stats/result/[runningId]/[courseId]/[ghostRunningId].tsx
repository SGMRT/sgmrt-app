import { ChevronIcon, ShareIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getRun,
    getRunComperison,
    patchCourseName,
    patchRunName,
    RunComperisonResponse,
} from "@/src/apis";
import { CourseDetailResponse } from "@/src/apis/types/course";
import StyledChart from "@/src/components/chart/StyledChart";
import { RunningRecord } from "@/src/components/map/courseInfo/RunningRecord";
import ResultCourseMap from "@/src/components/result/ResultCourseMap";
import RunShot, { RunShotHandle } from "@/src/components/share/RunShot";
import { ShareBottomSheet } from "@/src/components/share/ShareBottomSheet";
import { ShareVariant } from "@/src/components/share/types";
import BottomModal from "@/src/components/ui/BottomModal";
import { Button } from "@/src/components/ui/Button";
import Header from "@/src/components/ui/Header";
import LoadingLayer from "@/src/components/ui/LoadingLayer";
import NameInput from "@/src/components/ui/NameInput";
import ScrollButton from "@/src/components/ui/ScrollButton";
import Section from "@/src/components/ui/Section";
import StatRow from "@/src/components/ui/StatRow";
import { StyledButton } from "@/src/components/ui/StyledButton";
import TabBar from "@/src/components/ui/TabBar";
import { showToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import ReplayRecoder, {
    ReplayRecorderHandle,
} from "@/src/features/replay/ReplayRecoder";
import colors from "@/src/theme/colors";
import { devLog } from "@/src/utils/devLog";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Share from "react-native-share";

export type ShareVariantWithVideo = ShareVariant | "video";

export default function Result() {
    const { runningId, courseId, ghostRunningId } = useLocalSearchParams();
    const [runShotVariant, setRunShotVariant] = useState<ShareVariantWithVideo>(
        "default" as ShareVariantWithVideo
    );
    const [replayProgress, setReplayProgress] = useState(-1);
    const [displayMode, setDisplayMode] = useState<"pace" | "course">("pace");
    const runShotRef = useRef<RunShotHandle>(null);
    const { bottom } = useSafeAreaInsets();
    const [isTabBar, setIsTabBar] = useState(false);
    const resultTrackRef = useRef({
        view: false,
        graphOpen: false,
        viewScroll: false,
        infoChange: false,
        graphDrag: false,
    });

    const runningMode = useMemo(() => {
        if (courseId === "-1") {
            return "SOLO";
        } else if (ghostRunningId === "-1") {
            return "COURSE";
        } else {
            return "GHOST";
        }
    }, [courseId, ghostRunningId]);

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const shareBottomSheetRef = useRef<BottomSheetModal>(null);
    const replayRecoderRef = useRef<ReplayRecorderHandle>(null);

    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };

    const changeDisplayMode = () => {
        if (!resultTrackRef.current.infoChange) {
            resultTrackRef.current.infoChange = true;
            trackAmplitude("run_detail_view_movement", {
                action: "change_button_click",
            });
        }
        setDisplayMode((prev) => (prev === "pace" ? "course" : "pace"));
    };

    const [courseName, setCourseName] = useState("");

    const router = useRouter();

    const queryClient = useQueryClient();

    const {
        data: runData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["result", runningId],
        queryFn: () => getRun(Number(runningId)),
        enabled: !!runningId,
    });

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: courseId !== "-1",
    });

    const { data: comperison } = useQuery<RunComperisonResponse>({
        queryKey: ["match-result", runningId],
        queryFn: () =>
            getRunComperison(Number(runningId), Number(ghostRunningId)),
        enabled: runningMode === "GHOST" && !!runningId && !!ghostRunningId,
    });

    const [recordTitle, setRecordTitle] = useState(runData?.runningName ?? "");

    const isChartActive = useSharedValue(false);
    const chartPointIndex = useSharedValue(0);

    const paceStats = useMemo(() => {
        return [
            {
                description: "평균",
                value: getFormattedPace(runData?.recordInfo.averagePace ?? 0),
            },
            {
                description: "순간 최고",
                value: getFormattedPace(runData?.recordInfo.lowestPace ?? 0),
            },
            {
                description: "순간 최저",
                value: getFormattedPace(runData?.recordInfo.highestPace ?? 0),
            },
        ];
    }, [runData]);

    const courseStats = useMemo(() => {
        return [
            {
                description: "전체 거리",
                value: (runData?.recordInfo.distance ?? 0).toFixed(2),
                unit: "km",
            },
            {
                description: "상승 고도",
                value: runData?.recordInfo.elevationGain ?? 0,
                unit: "m",
            },
            {
                description: "하강 고도",
                value: Math.abs(runData?.recordInfo.elevationLoss ?? 0),
                unit: "m",
            },
        ];
    }, [runData]);

    const runningStats = useMemo(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    runData?.recordInfo.duration ?? 0,
                    "HH:MM:SS_IF_HH_EXISTS"
                ),
            },
            {
                description: "케이던스",
                value: runData?.recordInfo.cadence ?? 0,
                unit: "spm",
            },
            {
                description: "칼로리",
                value: runData?.recordInfo.calories ?? 0,
                unit: "kcal",
            },
        ];
    }, [runData]);

    const captureStats = useMemo(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    runData?.recordInfo.duration ?? 0,
                    "HH:MM:SS"
                ),
            },
            {
                description: "평균 페이스",
                value: getFormattedPace(runData?.recordInfo.averagePace ?? 0),
            },
            {
                description: "케이던스(spm)",
                value:
                    runData?.recordInfo.cadence ?? 0 > 0
                        ? Math.round(runData?.recordInfo.cadence ?? 0)
                        : "--",
            },
            {
                description: "칼로리(kcal)",
                value: runData?.recordInfo.calories ?? 0,
            },
            {
                description: "평균 심박수",
                value: runData?.recordInfo.bpm ?? "--",
            },
            {
                description: "고도 상승",
                value:
                    (runData?.recordInfo.elevationGain ?? 0).toString() + "m",
            },
        ];
    }, [runData]);

    const DisplaySlideToAction = useMemo(() => {
        if (courseId === "-1" && ghostRunningId === "-1") {
            const canMakeCourse =
                !runData?.telemetries.some(
                    (telemetry) => !telemetry.isRunning
                ) && !runData?.courseInfo?.isPublic;
            if (canMakeCourse) {
                return (
                    <Button
                        type="active"
                        title="코스 등록"
                        onPress={handlePresentModalPress}
                        topStroke
                    />
                );
            }
        }
        setIsTabBar(true);
        return <TabBar />;
    }, [
        courseId,
        ghostRunningId,
        runData?.telemetries,
        runData?.courseInfo?.isPublic,
    ]);

    const captureMap = useCallback(async () => {
        try {
            const uri = await runShotRef.current?.capture?.().then((uri) => {
                return uri;
            });

            const filename = runData?.runningName + ".jpg";
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
    }, [runData?.runningName]);

    const showShareBottomSheet = () => {
        shareBottomSheetRef.current?.present();
    };
    const handleShareBottomSheetSelect = (variant: ShareVariantWithVideo) => {
        setRunShotVariant(variant);
    };

    async function handleShareVideo() {
        try {
            shareBottomSheetRef.current?.dismiss();
            replayRecoderRef.current?.reset();
            setReplayProgress(0);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await replayRecoderRef.current?.startRecording();
        } catch (e) {
            console.log("handleShareVideo error: ", e);
        }
    }

    const handleShare = async () => {
        if (runShotVariant !== "video") {
            const uri = await captureMap();
            Share.open({
                title: runData?.runningName,
                message: getDate(
                    runData?.startedAt ?? new Date().getTime()
                ).trim(),
                filename: runData?.runningName ?? "run.jpg",
                url: uri ?? "",
            })
                .then((res) => {
                    devLog(res);
                    if (res.success) {
                        trackAmplitude("Run Shared", {
                            variant: runShotVariant,
                        });
                    }
                })
                .catch((err) => {
                    err && devLog(err);
                });
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
                        onPress: async () => {
                            await handleShareVideo();
                        },
                    },
                ]
            );
        }
    };

    useEffect(() => {
        if (!resultTrackRef.current.view) {
            resultTrackRef.current.view = true;
            trackAmplitude("run_detail_view");
        }
    }, []);

    if (isLoading) {
        return <></>;
    }

    if (isError) {
        router.replace("/");
    }

    return (
        runData && (
            <>
                <SafeAreaView style={styles.container}>
                    <Header titleText={getDate(runData.startedAt)} />
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        onScrollEndDrag={() => {
                            if (!resultTrackRef.current.viewScroll) {
                                resultTrackRef.current.viewScroll = true;
                                trackAmplitude("run_detail_view_movement", {
                                    action: "scroll",
                                });
                            }
                        }}
                    >
                        {/* 제목 파트 */}
                        <View style={styles.titleContainer}>
                            <View style={styles.titleInputContainer}>
                                <NameInput
                                    defaultValue={runData.runningName}
                                    placeholder="제목을 입력해주세요"
                                    onChangeText={setRecordTitle}
                                    onBlur={async () => {
                                        await patchRunName(
                                            Number(runningId),
                                            recordTitle
                                        ).then(() => {
                                            showToast(
                                                "success",
                                                "러닝명이 변경되었습니다",
                                                bottom
                                            );
                                        });
                                    }}
                                />
                            </View>

                            <Pressable onPress={showShareBottomSheet}>
                                <ShareIcon />
                            </Pressable>
                        </View>

                        {/* 코스 지도 파트 */}
                        <View
                            style={{
                                borderRadius: 20,
                                alignItems: "center",
                                backgroundColor: "#171717",
                                width: "100%",
                            }}
                        >
                            <ResultCourseMap
                                telemetries={runData.telemetries ?? []}
                                isChartActive={isChartActive}
                                chartPointIndex={chartPointIndex}
                                yKey={displayMode === "pace" ? "pace" : "alt"}
                            />
                            {courseId !== "-1" && course?.name && (
                                <TouchableOpacity
                                    onPress={() => {
                                        router.push(
                                            `/profile/${courseId}/detail`
                                        );
                                    }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginVertical: 12,
                                    }}
                                >
                                    <Typography variant="body2" color="gray40">
                                        {course?.name} 코스
                                    </Typography>
                                    <ChevronIcon color={colors.gray[40]} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 내 페이스 및 코스 정보 파트 */}
                        <Section
                            title={
                                displayMode === "pace"
                                    ? "내 페이스"
                                    : "내 코스 정보"
                            }
                            titleColor="white"
                            titleVariant="sectionhead"
                            titleRightChildren={
                                <StyledButton
                                    title={
                                        displayMode === "pace"
                                            ? "코스 정보"
                                            : "내 페이스"
                                    }
                                    onPress={changeDisplayMode}
                                    style={{ paddingHorizontal: 12 }}
                                />
                            }
                            style={{ gap: 15 }}
                        >
                            <StatRow
                                color="gray20"
                                style={{ gap: 20 }}
                                stats={
                                    displayMode === "pace"
                                        ? paceStats
                                        : courseStats
                                }
                            />
                            <StyledChart
                                label={
                                    displayMode === "pace" ? "페이스" : "고도"
                                }
                                data={runData.telemetries}
                                xKey="dist"
                                yKeys={
                                    displayMode === "pace" ? ["pace"] : ["alt"]
                                }
                                invertYAxis={
                                    displayMode === "pace" ? true : false
                                }
                                showToolTip={true}
                                onPointChange={(payload) => {
                                    if (!resultTrackRef.current.graphOpen) {
                                        resultTrackRef.current.graphOpen = true;
                                        trackAmplitude(
                                            "run_detail_view_movement",
                                            {
                                                action: "graph_point_click",
                                            }
                                        );
                                    }
                                    isChartActive.value = payload.isActive;
                                    chartPointIndex.value = payload.index;
                                }}
                                onExpand={() => {
                                    if (!resultTrackRef.current.graphOpen) {
                                        resultTrackRef.current.graphOpen = true;
                                        trackAmplitude(
                                            "run_detail_view_movement",
                                            {
                                                action: "graph_open",
                                            }
                                        );
                                    }
                                }}
                                expandable
                            />
                        </Section>
                        {runningMode !== "GHOST" && (
                            <Section
                                title="내 러닝 정보"
                                titleColor="white"
                                titleVariant="sectionhead"
                            >
                                <StatRow
                                    color="gray20"
                                    style={{ gap: 20 }}
                                    stats={runningStats}
                                />
                            </Section>
                        )}

                        {/* 고스트 러닝 기록 비교  (고스트 러닝) */}
                        {runningMode === "GHOST" && comperison && (
                            <Section
                                title="기록 비교"
                                titleVariant="sectionhead"
                                titleColor="white"
                                style={{ gap: 20, marginBottom: 20 }}
                            >
                                <RunningRecord
                                    user={{
                                        nickname:
                                            comperison?.ghostRunInfo.nickname,
                                        profileUrl:
                                            comperison?.ghostRunInfo.profileUrl,
                                    }}
                                    isMine={false}
                                    stats={[
                                        {
                                            description: "시간",
                                            value: getRunTime(
                                                comperison?.ghostRunInfo
                                                    .recordInfo.duration ?? 0,
                                                "HH:MM:SS_IF_HH_EXISTS"
                                            ),
                                        },
                                        {
                                            description: "페이스",
                                            value: getFormattedPace(
                                                comperison?.ghostRunInfo
                                                    .recordInfo.averagePace ?? 0
                                            ),
                                        },
                                        {
                                            description: "케이던스",
                                            value:
                                                comperison?.ghostRunInfo
                                                    .recordInfo.cadence ?? 0,
                                            unit: "spm",
                                        },
                                    ]}
                                />
                                <RunningRecord
                                    user={{
                                        nickname:
                                            comperison?.myRunInfo.nickname,
                                        profileUrl:
                                            comperison?.myRunInfo.profileUrl,
                                    }}
                                    isMine={true}
                                    stats={[
                                        {
                                            description: "시간",
                                            value: getRunTime(
                                                comperison?.myRunInfo.recordInfo
                                                    .duration ?? 0,
                                                "HH:MM:SS_IF_HH_EXISTS"
                                            ),
                                        },
                                        {
                                            description: "페이스",
                                            value: getFormattedPace(
                                                comperison?.myRunInfo.recordInfo
                                                    .averagePace ?? 0
                                            ),
                                        },
                                        {
                                            description: "케이던스",
                                            value:
                                                comperison?.myRunInfo.recordInfo
                                                    .cadence ?? 0,
                                            unit: "spm",
                                        },
                                    ]}
                                />
                            </Section>
                        )}
                    </ScrollView>
                    {isTabBar && <View style={{ height: 50 }} />}
                    {DisplaySlideToAction}
                </SafeAreaView>
                <ScrollButton
                    onPress={() => {
                        scrollViewRef.current?.scrollTo({
                            y: 0,
                            animated: true,
                        });
                    }}
                    bottomInset={isTabBar ? 0 : 16}
                />
                <BottomModal
                    bottomSheetRef={bottomSheetRef}
                    canClose={true}
                    handleStyle={styles.handle}
                >
                    <View style={styles.bottomSheetContent}>
                        <NameInput
                            placeholder="코스명을 입력해주세요"
                            onChangeText={setCourseName}
                            bottomSheet
                        />
                        <Typography variant="body3" color="gray40">
                            코스를 한 번 등록하면 삭제 및 수정이 어렵습니다
                        </Typography>
                    </View>

                    <Button
                        title="코스 등록"
                        onPress={() => {
                            patchCourseName(
                                runData?.courseInfo.id,
                                courseName,
                                true
                            )
                                .then(() => {
                                    bottomSheetRef.current?.dismiss();
                                    router.replace({
                                        pathname: "/(tabs)/profile",
                                        params: {
                                            tab: "course",
                                        },
                                    });
                                    // course_register
                                    trackAmplitude("Course Created", {
                                        courseId: runData?.courseInfo.id,
                                        courseName: courseName,
                                        distance: runData?.recordInfo.distance,
                                        elevationGain:
                                            runData?.recordInfo.elevationGain,
                                    });
                                    showToast(
                                        "success",
                                        "코스가 등록되었습니다",
                                        bottom
                                    );
                                })
                                .finally(() => {
                                    queryClient.invalidateQueries({
                                        queryKey: ["courses"],
                                    });
                                    queryClient.invalidateQueries({
                                        queryKey: ["course", courseId],
                                    });
                                    queryClient.invalidateQueries({
                                        queryKey: ["user-courses"],
                                    });
                                });
                        }}
                        type="active"
                    />
                </BottomModal>
                {replayProgress >= 0 && runShotVariant === "video" && (
                    <LoadingLayer progress={replayProgress}>
                        <Pressable
                            onPress={() => {
                                replayRecoderRef.current?.reset();
                            }}
                        >
                            <Typography variant="body3" color="gray40">
                                취소하기
                            </Typography>
                        </Pressable>
                    </LoadingLayer>
                )}
                <ShareBottomSheet
                    ref={shareBottomSheetRef}
                    selected={runShotVariant}
                    onSelect={handleShareBottomSheetSelect}
                    onShare={handleShare}
                />
                {runShotVariant !== "video" && (
                    <RunShot
                        ref={runShotRef}
                        title={runData?.runningName}
                        fileName={runData?.runningName + ".jpg"}
                        telemetries={runData.telemetries ?? []}
                        distance={runData.recordInfo.distance.toFixed(2)}
                        type="share"
                        stats={captureStats}
                        variant={runShotVariant as ShareVariant}
                    />
                )}
                {runShotVariant === "video" && (
                    <ReplayRecoder
                        ref={replayRecoderRef}
                        telemetries={runData.telemetries ?? []}
                        visualFps={60}
                        width={360}
                        height={350}
                        autoShare={true}
                        name={runData.runningName}
                        distance={runData.recordInfo.distance.toFixed(2)}
                        stats={captureStats}
                        onProgress={(progress) => {
                            setReplayProgress(progress);
                        }}
                        onFinish={() => {
                            setReplayProgress(-1);
                        }}
                    />
                )}
            </>
        )
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    titleInputContainer: {
        flexDirection: "row",
        gap: 4,
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1,
        maxWidth: "50%",
    },
    content: {
        backgroundColor: "#111111",
        marginHorizontal: 16.5,
        marginTop: 20,
        gap: 20,
        paddingBottom: 20,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
    bottomSheetContent: {
        paddingTop: 30,
        paddingBottom: 50,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: "#111111",
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 0,
    },
    shareButton: {
        marginLeft: 8,
        flex: 1,
    },
});
