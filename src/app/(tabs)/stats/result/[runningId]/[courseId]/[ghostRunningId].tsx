import { ChevronIcon, ShareIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getRun,
    getRunComperison,
    patchRunName,
    RunComperisonResponse,
} from "@/src/apis";
import { CourseDetailResponse } from "@/src/apis/types/course";
import StyledChart from "@/src/components/chart/StyledChart";
import ResultCourseMap from "@/src/components/result/ResultCourseMap";
import RunShot from "@/src/components/share/RunShot";
import { ShareBottomSheet } from "@/src/components/share/ShareBottomSheet";
import { ShareVariant } from "@/src/components/share/types";
import { Header, LoadingLayer, ScrollButton, Section, StatRow, TabBar, Typography, showToast } from "@/src/components/ui";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import { Button } from "@/src/design-system/atoms/Button";
import { InlineInput } from "@/src/design-system/atoms/InlineInput";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import ReplayRecoder from "@/src/features/replay/ReplayRecoder";
import CourseRegisterModal from "@/src/features/result/components/CourseRegisterModal";
import GhostComparisonSection from "@/src/features/result/components/GhostComparisonSection";
import { useResultShare } from "@/src/features/result/hooks/useResultShare";
import { useResultStats } from "@/src/features/result/hooks/useResultStats";
import colors from "@/src/theme/colors";
import { getDate } from "@/src/utils/runUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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

export type { ShareVariantWithVideo } from "@/src/features/result/hooks/useResultShare";

export default function Result() {
    const { runningId, courseId, ghostRunningId } = useLocalSearchParams();
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();

    const [displayMode, setDisplayMode] = useState<"pace" | "course">("pace");
    const [isTabBar, setIsTabBar] = useState(false);
    const [recordTitle, setRecordTitle] = useState("");

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const resultTrackRef = useRef({
        view: false,
        graphOpen: false,
        viewScroll: false,
        infoChange: false,
        graphDrag: false,
    });

    const runningMode = useMemo(() => {
        if (courseId === "-1") return "SOLO";
        if (ghostRunningId === "-1") return "COURSE";
        return "GHOST";
    }, [courseId, ghostRunningId]);

    // Data fetching
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

    const { data: comparison } = useQuery<RunComperisonResponse>({
        queryKey: ["match-result", runningId],
        queryFn: () =>
            getRunComperison(Number(runningId), Number(ghostRunningId)),
        enabled: runningMode === "GHOST" && !!runningId && !!ghostRunningId,
    });

    // Custom hooks
    const { paceStats, courseStats, runningStats, captureStats } =
        useResultStats(runData ?? undefined);

    const {
        runShotVariant,
        replayProgress,
        runShotRef,
        shareBottomSheetRef,
        replayRecoderRef,
        showShareBottomSheet,
        handleShareBottomSheetSelect,
        handleShare,
        setReplayProgress,
    } = useResultShare({
        runningName: runData?.runningName,
        startedAt: runData?.startedAt,
        bottom,
        showToast,
    });

    // Chart state
    const isChartActive = useSharedValue(false);
    const chartPointIndex = useSharedValue(0);

    const changeDisplayMode = () => {
        if (!resultTrackRef.current.infoChange) {
            resultTrackRef.current.infoChange = true;
            trackAmplitude("run_detail_view_movement", {
                action: "change_button_click",
            });
        }
        setDisplayMode((prev) => (prev === "pace" ? "course" : "pace"));
    };

    const DisplaySlideToAction = useMemo(() => {
        if (courseId === "-1" && ghostRunningId === "-1") {
            const canMakeCourse = !runData?.courseInfo?.isPublic;
            if (canMakeCourse) {
                return (
                    <BottomAgreementButton
                        isActive
                        title="코스 등록"
                        onPress={() => bottomSheetRef.current?.present()}
                        topStroke
                    />
                );
            }
        }
        setIsTabBar(true);
        return <TabBar />;
    }, [courseId, ghostRunningId, runData?.courseInfo?.isPublic]);

    useEffect(() => {
        if (!resultTrackRef.current.view) {
            resultTrackRef.current.view = true;
            trackAmplitude("run_detail_view");
        }
    }, []);

    useEffect(() => {
        if (runData?.runningName) {
            setRecordTitle(runData.runningName);
        }
    }, [runData?.runningName]);

    if (isLoading) return <></>;
    if (isError) {
        router.replace("/");
        return null;
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
                                <InlineInput
                                    defaultValue={runData.runningName}
                                    placeholder="제목을 입력해 주세요"
                                    onChangeText={setRecordTitle}
                                    onBlur={async () => {
                                        await patchRunName(
                                            Number(runningId),
                                            recordTitle
                                        );
                                        showToast(
                                            "success",
                                            "러닝명이 변경되었습니다",
                                            bottom
                                        );
                                    }}
                                />
                            </View>
                            <Pressable onPress={showShareBottomSheet}>
                                <ShareIcon />
                            </Pressable>
                        </View>

                        {/* 코스 지도 파트 */}
                        <View style={styles.mapContainer}>
                            <ResultCourseMap
                                telemetries={runData.telemetries ?? []}
                                isChartActive={isChartActive}
                                chartPointIndex={chartPointIndex}
                                yKey={displayMode === "pace" ? "pace" : "alt"}
                            />
                            {courseId !== "-1" && course?.name && (
                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            `/profile/${courseId}/detail`
                                        )
                                    }
                                    style={styles.courseLink}
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
                                /* 섹션 제목 줄에 놓인 작은 조작이라 small 을 쓴다.
                                   보여 줄 내용을 바꾸는 보조 행동이므로 line 이다. */
                                <Button
                                    title={
                                        displayMode === "pace"
                                            ? "코스 정보"
                                            : "내 페이스"
                                    }
                                    onPress={changeDisplayMode}
                                    size="small"
                                    variant="line"
                                />
                            }
                            style={{ gap: spacing[16] }}
                        >
                            <StatRow
                                color="gray20"
                                style={{ gap: spacing[20] }}
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
                                invertYAxis={displayMode === "pace"}
                                showToolTip={true}
                                onPointChange={(payload) => {
                                    if (!resultTrackRef.current.graphOpen) {
                                        resultTrackRef.current.graphOpen = true;
                                        trackAmplitude(
                                            "run_detail_view_movement",
                                            { action: "graph_point_click" }
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
                                            { action: "graph_open" }
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
                                    style={{ gap: spacing[20] }}
                                    stats={runningStats}
                                />
                            </Section>
                        )}

                        {runningMode === "GHOST" && comparison && (
                            <GhostComparisonSection comparison={comparison} />
                        )}
                    </ScrollView>

                    {isTabBar && <View style={{ height: 50 }} />}
                    {DisplaySlideToAction}
                </SafeAreaView>

                <ScrollButton
                    onPress={() =>
                        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
                    }
                    bottomInset={isTabBar ? 0 : 16}
                />

                <CourseRegisterModal
                    bottomSheetRef={bottomSheetRef}
                    courseInfoId={runData.courseInfo.id}
                    distance={runData.recordInfo.distance}
                    elevationGain={runData.recordInfo.elevationGain}
                    courseId={courseId as string}
                    bottom={bottom}
                />

                {replayProgress >= 0 && runShotVariant === "video" && (
                    <LoadingLayer progress={replayProgress}>
                        <Pressable
                            onPress={() => replayRecoderRef.current?.reset()}
                        >
                            <Typography variant="body3" color="gray40">
                                취소하기
                            </Typography>
                        </Pressable>
                    </LoadingLayer>
                )}

                <ShareBottomSheet
                    bottomSheetRef={shareBottomSheetRef}
                    selected={runShotVariant}
                    onSelect={handleShareBottomSheetSelect}
                    onShare={handleShare}
                />

                {runShotVariant !== "video" && (
                    <RunShot
                        ref={runShotRef}
                        title={runData.runningName}
                        fileName={runData.runningName + ".png"}
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
                        onProgress={setReplayProgress}
                        onFinish={() => setReplayProgress(-1)}
                    />
                )}
            </>
        )
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.uiBackground,
    },
    content: {
        backgroundColor: darkTheme.uiBackground,
        marginHorizontal: spacing[16],
        marginTop: spacing[20],
        gap: spacing[20],
        paddingBottom: spacing[20],
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    titleInputContainer: {
        flexDirection: "row",
        gap: spacing[4],
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1,
        maxWidth: "50%",
    },
    mapContainer: {
        borderRadius: radius["2xl"],
        alignItems: "center",
        backgroundColor: darkTheme.ui01,
        width: "100%",
    },
    courseLink: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing[12],
    },
});
