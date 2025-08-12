import { LockIcon, ShareIcon, UnlockIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getCourseTopRanking,
    getRun,
    patchCourseName,
    patchRunName,
} from "@/src/apis";
import { CourseDetailResponse, HistoryResponse } from "@/src/apis/types/course";
import StyledChart from "@/src/components/chart/StyledChart";
import { GhostInfoSection } from "@/src/components/map/courseInfo/BottomCourseInfoModal";
import ResultCorseMap from "@/src/components/result/ResultCorseMap";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import NameInput from "@/src/components/ui/NameInput";
import Section from "@/src/components/ui/Section";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatRow from "@/src/components/ui/StatRow";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { calculateCenter } from "@/src/utils/mapUtils";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Result() {
    const { runningId, courseId, ghostRunningId } = useLocalSearchParams();
    const [displayMode, setDisplayMode] = useState<"pace" | "course">("pace");
    const [isLocked, setIsLocked] = useState(true);

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

    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };

    const changeDisplayMode = () => {
        setDisplayMode((prev) => (prev === "pace" ? "course" : "pace"));
    };

    const [courseName, setCourseName] = useState("");
    const { bottom } = useSafeAreaInsets();

    const router = useRouter();

    const {
        data: runData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["result", runningId],
        queryFn: () => getRun(Number(runningId)),
        enabled: !!runningId,
    });

    const { data: ghostList } = useQuery<HistoryResponse[]>({
        queryKey: ["course-top-ranking", courseId],
        queryFn: () =>
            getCourseTopRanking({ courseId: Number(courseId), count: 3 }),
        enabled: courseId !== "-1",
    });

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: courseId !== "-1",
    });

    const [recordTitle, setRecordTitle] = useState(runData?.runningName ?? "");

    const center = useMemo(
        () =>
            calculateCenter(
                runData?.telemetries?.map((telemetry) => ({
                    lat: telemetry.lat,
                    lng: telemetry.lng,
                })) ?? []
            ),
        [runData?.telemetries]
    );

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
                description: "고도",
                value: runData?.recordInfo.totalElevation ?? 0,
                unit: "m",
            },
            {
                description: "상승",
                value: runData?.recordInfo.elevationGain ?? 0,
                unit: "m",
            },
            {
                description: "하강",
                value: runData?.recordInfo.elevationLoss ?? 0,
                unit: "m",
            },
        ];
    }, [runData]);

    const courseAverageStats = useMemo(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    course?.averageCompletionTime ?? 0,
                    "HH:MM:SS"
                ),
                unit: "",
            },
            {
                description: "케이던스",
                value: course?.averageFinisherCadence ?? "--",
                unit: "spm",
            },
            {
                description: "칼로리",
                value: "--",
                unit: "kcal",
            },
            {
                description: "페이스",
                value: getFormattedPace(course?.averageFinisherPace ?? 0),
                unit: "",
            },
        ];
    }, [course]);

    const runningStats = useMemo(() => {
        return [
            {
                description: "시간",
                value: getRunTime(
                    runData?.recordInfo.duration ?? 0,
                    "HH:MM:SS"
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

    const DisplaySlideToAction = useMemo(() => {
        if (courseId === "-1" && ghostRunningId === "-1") {
            const canMakeCourse = !runData?.telemetries.some(
                (telemetry) => !telemetry.isRunning
            );
            if (canMakeCourse) {
                return (
                    <SlideToDualAction
                        leftLabel="메인으로"
                        rightLabel="코스 등록"
                        onSlideLeft={() => {
                            router.replace("/");
                        }}
                        onSlideRight={handlePresentModalPress}
                        color="primary"
                    />
                );
            }
        }
        return (
            <SlideToAction
                label="메인으로"
                onSlideSuccess={() => {
                    router.replace("/");
                }}
                color="green"
                direction="left"
            />
        );
    }, [courseId, ghostRunningId, runData?.telemetries, router]);

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
                    <Header
                        titleText={getDate(runData.startedAt)}
                        rightComponent={
                            runningMode !== "SOLO" && (
                                <Pressable
                                    onPress={() => {
                                        Toast.show({
                                            type: "info",
                                            text1: "해당 기능은 준비 중입니다",
                                            position: "bottom",
                                        });
                                        setIsLocked(!isLocked);
                                        // patchRunIsPublic(Number(runningId));
                                    }}
                                >
                                    {isLocked ? (
                                        <LockIcon width={20} height={20} />
                                    ) : (
                                        <UnlockIcon width={20} height={20} />
                                    )}
                                </Pressable>
                            )
                        }
                    />
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
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
                                            Toast.show({
                                                type: "success",
                                                text1: "제목이 변경되었습니다",
                                                position: "bottom",
                                            });
                                        });
                                    }}
                                />
                            </View>
                            <Pressable
                                onPress={() => {
                                    Toast.show({
                                        type: "info",
                                        text1: "해당 기능은 준비 중입니다",
                                        position: "bottom",
                                    });
                                }}
                            >
                                <ShareIcon style={styles.shareButton} />
                            </Pressable>
                        </View>

                        {/* 코스 지도 파트 */}
                        <ResultCorseMap
                            center={center}
                            telemetries={runData.telemetries ?? []}
                        />

                        {/* 내 페이스 및 코스 정보 파트 */}
                        <Section
                            title="내 페이스"
                            titleColor="white"
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
                                invertYAxis={true}
                                expandable
                            />
                        </Section>
                        <Section title="내 러닝 정보" titleColor="white">
                            <StatRow
                                color="gray20"
                                style={{ gap: 20 }}
                                stats={runningStats}
                            />
                        </Section>

                        {/* 고스트 러닝 기록 비교  (고스트 러닝) */}

                        {/* 코스 관련 정보 (!솔로 러닝)*/}
                        {runningMode !== "SOLO" && (
                            <GhostInfoSection
                                stats={courseAverageStats}
                                uuid={null}
                                ghostList={ghostList ?? []}
                                selectedGhostId={0}
                                setSelectedGhostId={() => {}}
                                onPress={() => {}}
                                hasMargin={false}
                                color="white"
                            />
                        )}
                    </ScrollView>
                    {DisplaySlideToAction}
                </SafeAreaView>
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

                    <SlideToAction
                        label="등록하기"
                        onSlideSuccess={() => {
                            patchCourseName(
                                runData?.courseInfo.id ?? 0,
                                courseName,
                                true
                            ).then(() => {
                                router.replace({
                                    pathname: "/(tabs)/(profile)/profile",
                                    params: {
                                        tab: "course",
                                    },
                                });
                                Toast.show({
                                    type: "success",
                                    text1: "코스가 등록되었습니다",
                                    position: "bottom",
                                });
                            });
                        }}
                        color="green"
                        direction="left"
                    />
                </BottomModal>
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
        paddingVertical: 30,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
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
