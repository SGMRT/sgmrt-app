import { ChevronIcon } from "@/assets/svgs/svgs";
import { getCourse, getCourseTopRanking } from "@/src/apis";
import { CourseDetailResponse, HistoryResponse } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import BottomModal from "../../ui/BottomModal";
import { Divider } from "../../ui/Divider";
import SlideToAction from "../../ui/SlideToAction";
import StatsIndicator from "../../ui/StatsIndicator";
import { Typography } from "../../ui/Typography";
import UserStatItem from "./UserStatItem";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
    courseId: number;
    heightVal: SharedValue<number>;
}

export default function BottomCourseInfoModal({
    bottomSheetRef,
    canClose = true,
    heightVal,
    courseId,
}: BottomCourseInfoModalProps) {
    const [tab, setTab] = useState<"course" | "ghost">("course");

    const { data: ghostList } = useQuery<HistoryResponse[]>({
        queryKey: ["course-top-ranking", courseId],
        queryFn: () => getCourseTopRanking({ courseId: courseId, count: 3 }),
        enabled: !!courseId,
    });

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId),
        enabled: !!courseId,
    });

    const [selectedGhostId, setSelectedGhostId] = useState<number | null>(null);

    useEffect(() => {
        console.log("course: ", courseId);
        if (ghostList && ghostList.length > 0) {
            setSelectedGhostId(ghostList[0].runningId);
        }
    }, [ghostList]);

    const stats = [
        {
            label: "전체 거리",
            value: ((course?.distance ?? 0) / 1000).toFixed(2),
            unit: "km",
        },
        {
            label: "고도 상승",
            value: course?.elevationGain.toString() ?? "--",
            unit: "m",
        },
        {
            label: "고도 하강",
            value: course?.elevationLoss.toString() ?? "--",
            unit: "m",
        },
        {
            label: "평균 시간",
            value: getRunTime(course?.averageCompletionTime ?? 0, "MM:SS"),
            unit: "",
        },
        {
            label: "평균 페이스",
            value: getFormattedPace(course?.averageFinisherPace ?? 0),
            unit: "",
        },
        {
            label: "평균 케이던스",
            value: course?.averageFinisherCadence.toString() ?? "--",
            unit: "spm",
        },
    ];

    const router = useRouter();
    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            canClose={canClose}
            heightVal={heightVal}
        >
            <View style={styles.tabContainer}>
                <Pressable onPress={() => setTab("course")} style={styles.tab}>
                    <Typography
                        variant="subhead2"
                        color={tab === "course" ? "white" : "gray60"}
                    >
                        코스 상세 정보
                    </Typography>
                </Pressable>
                <Divider />
                <Pressable onPress={() => setTab("ghost")} style={styles.tab}>
                    <Typography
                        variant="subhead2"
                        color={tab === "ghost" ? "white" : "gray60"}
                    >
                        고스트 선택
                    </Typography>
                </Pressable>
            </View>
            {tab === "course" && (
                <View style={{ marginBottom: 30 }}>
                    <StatsIndicator stats={stats} />
                </View>
            )}
            {tab === "ghost" && (
                <View style={{ gap: 10 }}>
                    <View style={styles.ghostListContainer}>
                        <Typography variant="body1" color="gray40">
                            빠른 완주 순위
                        </Typography>
                        <View style={styles.ghostListContainerText}>
                            <Pressable
                                onPress={() => {
                                    bottomSheetRef.current?.dismiss();
                                    router.push(`/course/${course?.id}`);
                                }}
                            >
                                <Typography variant="body2" color="gray60">
                                    전체 보기
                                </Typography>
                            </Pressable>
                            <ChevronIcon />
                        </View>
                    </View>
                    {ghostList && ghostList.length > 0 && (
                        <View style={styles.marginBottom}>
                            {ghostList.map((ghost, index) => (
                                <UserStatItem
                                    key={ghost.runningId}
                                    rank={index + 1}
                                    name={ghost.runningName}
                                    avatar={ghost.runnerProfileUrl}
                                    time={getRunTime(ghost.duration, "MM:SS")}
                                    pace={getFormattedPace(ghost.averagePace)}
                                    cadence={ghost.cadence.toString() + " spm"}
                                    ghostId={ghost.runningId.toString()}
                                    isGhostSelected={
                                        selectedGhostId === ghost.runningId
                                    }
                                    onPress={() => {
                                        setSelectedGhostId(ghost.runningId);
                                    }}
                                    isMyRecord={ghost.runnerId === 1}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}
            <SlideToAction
                label={
                    tab === "course"
                        ? "이 코스로 러닝 시작"
                        : "고스트와 러닝 시작"
                }
                onSlideSuccess={() => {
                    console.log("slide success");
                    bottomSheetRef.current?.dismiss();
                    if (tab === "course") {
                        router.push(`/run/${course?.id}/${course?.name}`);
                    } else {
                        router.push(
                            `/run/${course?.id}/${course?.name}/${selectedGhostId}`
                        );
                    }
                }}
                color="green"
                direction="left"
            />
        </BottomModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 0,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    tab: {
        flex: 1,
        alignItems: "center",
    },
    courseInfoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 20,
        marginBottom: 30,
    },
    courseInfoItem: {
        width: "33%",
        alignItems: "center",
    },
    courseInfoItemValue: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    ghostListContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 17,
    },
    ghostListContainerText: {
        flexDirection: "row",
        alignItems: "center",
    },
    marginBottom: {
        marginBottom: 20,
    },
});
