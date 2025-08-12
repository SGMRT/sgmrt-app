import { getCourse, getCourseTopRanking } from "@/src/apis";
import { CourseDetailResponse, HistoryResponse } from "@/src/apis/types/course";
import { useAuthStore } from "@/src/store/authState";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import StyledChart from "../../chart/StyledChart";
import { Divider } from "../../ui/Divider";
import EmptyListView from "../../ui/EmptyListView";
import Section from "../../ui/Section";
import SlideToAction from "../../ui/SlideToAction";
import StatRow, { Stat } from "../../ui/StatRow";
import { Typography, TypographyColor } from "../../ui/Typography";
import UserStatItem from "./UserStatItem";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    courseId: number;
}

export default function BottomCourseInfoModal({
    bottomSheetRef,
    courseId,
}: BottomCourseInfoModalProps) {
    const [tab, setTab] = useState<"course" | "ghost">("course");

    const { data: ghostList } = useQuery<HistoryResponse[]>({
        queryKey: ["course-top-ranking", courseId],
        queryFn: () => getCourseTopRanking({ courseId: courseId, count: 3 }),
        enabled: courseId !== -1,
    });

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId),
        enabled: courseId !== -1,
    });

    const [selectedGhostId, setSelectedGhostId] = useState<number | null>(null);

    const { uuid } = useAuthStore();

    useEffect(() => {
        console.log("course: ", courseId);
        if (ghostList && ghostList.length > 0) {
            setSelectedGhostId(ghostList[0].runningId);
        }
    }, [ghostList, courseId]);

    const courseStats = [
        {
            description: "전체 거리",
            value: ((course?.distance ?? 0) / 1000).toFixed(2),
            unit: "km",
        },
        {
            description: "평균 고도",
            value: "--",
            unit: "m",
        },
        {
            description: "상승",
            value: course?.elevationGain.toString() ?? "--",
            unit: "m",
        },
        {
            description: "하강",
            value: course?.elevationLoss.toString() ?? "--",
            unit: "m",
        },
    ];

    const ghostStats = [
        {
            description: "시간",
            value: getRunTime(course?.averageCompletionTime ?? 0, "HH:MM:SS"),
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

    const router = useRouter();

    const dummyData = Array.from({ length: 12 }, (_, i) => ({
        dist: i,
        alt: Math.sin(i / 10) * 100,
    }));

    const onClickGhostRank = () => {
        bottomSheetRef.current?.dismiss();
        router.push(`/course/rank/${courseId}`);
    };

    return (
        <>
            <TabHeader tab={tab} setTab={setTab} />
            {tab === "course" && (
                <CourseInfoSection stats={courseStats} dummyData={dummyData} />
            )}
            {tab === "ghost" && (
                <GhostInfoSection
                    stats={ghostStats}
                    uuid={uuid}
                    ghostList={ghostList ?? []}
                    selectedGhostId={selectedGhostId ?? -1}
                    setSelectedGhostId={setSelectedGhostId}
                    onPress={onClickGhostRank}
                />
            )}
            <SlideToAction
                label={
                    tab === "course"
                        ? "이 코스로 러닝 시작"
                        : "고스트와 러닝 시작"
                }
                onSlideSuccess={() => {
                    bottomSheetRef.current?.dismiss();
                    if (tab === "course") {
                        router.push(`/run/${course?.id}/-1`);
                    } else {
                        router.push(`/run/${course?.id}/${selectedGhostId}`);
                    }
                }}
                color="green"
                direction="left"
            />
        </>
    );
}

export const GhostInfoSection = ({
    stats,
    uuid,
    ghostList,
    selectedGhostId,
    setSelectedGhostId,
    onPress,
    hasMargin = true,
    color = "gray40",
}: {
    stats: Stat[];
    uuid: string | null;
    ghostList: HistoryResponse[];
    selectedGhostId: number;
    setSelectedGhostId: (ghostId: number) => void;
    onPress: () => void;
    hasMargin?: boolean;
    color?: TypographyColor;
}) => {
    if (ghostList.length === 0) {
        return (
            <View
                style={{
                    marginBottom: hasMargin ? 30 : 0,
                    marginHorizontal: hasMargin ? 16.5 : 0,
                }}
            >
                <Section title="고스트 평균 정보" titleColor={color}>
                    <EmptyListView
                        description={`등록된 고스트가 아직 없어요\n코스 러닝을 시작해 첫 고스트가 되어보세요!`}
                    />
                </Section>
            </View>
        );
    }
    return (
        <View
            style={{
                gap: 20,
                marginHorizontal: hasMargin ? 16.5 : 0,
                marginBottom: hasMargin ? 30 : 0,
            }}
        >
            <Section title="고스트 평균 정보" titleColor={color}>
                <StatRow
                    stats={stats}
                    color="gray20"
                    style={{
                        justifyContent: "space-between",
                    }}
                />
            </Section>
            <Section
                title="고스트 TOP3"
                shortcutTitle="순위 전체"
                titleColor={color}
                onPress={() => {
                    onPress();
                }}
                style={{
                    gap: 20,
                }}
            >
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
                        isGhostSelected={selectedGhostId === ghost.runningId}
                        onPress={() => {
                            setSelectedGhostId(ghost.runningId);
                        }}
                        isMyRecord={ghost.runnerUuid === uuid}
                        paddingHorizontal={false}
                        paddingVertical={false}
                    />
                ))}
            </Section>
        </View>
    );
};

const CourseInfoSection = ({
    stats,
    dummyData,
}: {
    stats: Stat[];
    dummyData: any[];
}) => {
    return (
        <View
            style={{
                marginBottom: 30,
                marginHorizontal: 16.5,
                paddingVertical: 5,
            }}
        >
            <Section
                style={{
                    gap: 15,
                }}
            >
                <StatRow
                    stats={stats}
                    color="gray20"
                    style={{
                        justifyContent: "space-between",
                    }}
                />
                <StyledChart
                    label="고도"
                    data={dummyData}
                    xKey="dist"
                    yKeys={["alt"]}
                />
            </Section>
        </View>
    );
};

const TabHeader = ({
    tab,
    setTab,
}: {
    tab: "course" | "ghost";
    setTab: (tab: "course" | "ghost") => void;
}) => {
    return (
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
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    tab: {
        flex: 1,
        alignItems: "center",
    },
});
