import { DefaultProfileIcon } from "@/assets/icons/icons";
import { ChevronIcon, GhostIcon } from "@/assets/svgs/svgs";
import { getCourse } from "@/src/apis";
import { CourseDetailResponse, HistoryResponse } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledChart from "../../chart/StyledChart";
import { Button } from "../../ui/Button";
import { Divider } from "../../ui/Divider";
import EmptyListView from "../../ui/EmptyListView";
import Section from "../../ui/Section";
import StatRow, { Stat } from "../../ui/StatRow";
import { StyledSwitch } from "../../ui/StyledSwitch";
import { showToast } from "../../ui/toastConfig";
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
    const [ghost, setGhost] = useState({
        id: 1,
        profileUrl: "",
        time: 10000,
        pace: 1000,
        cadence: 100,
    });
    const [ghostSelected, setGhostSelected] = useState(true);

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId),
        enabled: courseId !== -1,
    });

    const courseStats = [
        {
            description: "전체 거리",
            value: ((course?.distance ?? 0) / 1000).toFixed(2),
            unit: "km",
        },
        {
            description: "고도",
            value: course?.elevationAverage.toString() ?? "--",
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
        { description: "시간", value: getRunTime(ghost.time, "HH:MM:SS") },
        {
            description: "페이스",
            value: getFormattedPace(ghost.pace),
        },
        {
            description: "케이던스",
            value: ghost.cadence,
            unit: "spm",
        },
    ];

    const router = useRouter();

    return (
        <View>
            <CourseInfoSection
                courseName={course?.name ?? ""}
                stats={courseStats}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/profile/${courseId}/detail`);
                }}
            />
            <View style={{ height: ghost ? 20 : 30 }} />
            <GhostSection
                ghost={ghost}
                ghostSelected={ghostSelected}
                onSwitchChange={setGhostSelected}
                ghostStats={ghostStats}
            />
            <Button
                style={{
                    marginHorizontal: 16.5,
                }}
                type="active"
                title={ghostSelected ? "고스트 러닝" : "코스 러닝"}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    if (ghostSelected && ghost && ghost.id === -1) {
                        router.push(`/run/${course?.id}/${ghost.id}`);
                    } else {
                        router.push(`/run/${course?.id}/-1`);
                    }
                }}
            />
        </View>
    );
}

const GhostSection = ({
    ghost,
    ghostSelected,
    onSwitchChange,
    ghostStats,
}: {
    ghost: any;
    ghostSelected: boolean;
    onSwitchChange: (value: boolean) => void;
    ghostStats: Stat[];
}) => {
    const { bottom } = useSafeAreaInsets();
    return (
        <Section
            title="내 고스트"
            titleColor="white"
            containerStyle={styles.ghostInfoSection}
            onClickInfo={() => {
                showToast("info", "내 고스트는 현재 지원하지 않아요.", bottom);
            }}
            titleRightChildren={
                <StyledSwitch
                    isSelected={ghostSelected}
                    onValueChange={(value) => {
                        onSwitchChange(value);
                    }}
                />
            }
        >
            <View style={styles.ghostRow}>
                <View style={styles.ghostAvatarContainer}>
                    <Image
                        source={
                            ghost.profileUrl
                                ? { uri: ghost.profileUrl }
                                : DefaultProfileIcon
                        }
                        style={styles.ghostAvatar}
                    />
                    <GhostIcon style={styles.ghostIcon} />
                </View>
                <Divider direction="vertical" />
                <StatRow
                    stats={ghostStats}
                    color="gray20"
                    style={styles.ghostStats}
                />
            </View>
        </Section>
    );
};

const styles = StyleSheet.create({
    ghostInfoSection: {
        marginBottom: 30,
        marginHorizontal: 16.5,
    },
    ghostRow: {
        paddingVertical: 10,
        paddingLeft: 14,
        width: "100%",
        backgroundColor: "#222222",
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    ghostAvatarContainer: {
        position: "relative",
    },
    ghostAvatar: {
        width: 40,
        height: 40,
        borderRadius: 100,
    },
    ghostIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
    },
    ghostStats: {
        gap: 14,
    },
});

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
                        cadence={ghost.cadence.toString()}
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
    courseName,
    stats,
    data = null,
    onPress,
}: {
    courseName: string;
    stats: Stat[];
    data?: any[] | null;
    onPress: () => void;
}) => {
    return (
        <View
            style={{
                marginHorizontal: 16.5,
            }}
        >
            <Section
                style={{
                    gap: 15,
                }}
            >
                <View style={{ marginBottom: 5, gap: 10 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="subhead1" color="gray20">
                            {courseName}
                        </Typography>
                        <Pressable
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                            onPress={onPress}
                        >
                            <Typography variant="caption1" color="gray40">
                                코스 상세
                            </Typography>
                            <ChevronIcon color={colors.gray[40]} />
                        </Pressable>
                    </View>
                    <Divider direction="horizontal" color={colors.gray[40]} />
                </View>
                <StatRow
                    stats={stats}
                    color="gray20"
                    style={{
                        justifyContent: "space-between",
                    }}
                />
                {data && (
                    <StyledChart
                        label="고도"
                        data={data}
                        xKey="dist"
                        yKeys={["alt"]}
                    />
                )}
            </Section>
        </View>
    );
};
