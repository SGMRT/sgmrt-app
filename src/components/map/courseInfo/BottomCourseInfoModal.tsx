import { ChevronIcon } from "@/assets/svgs/svgs";
import { CourseResponse, HistoryResponse } from "@/src/apis/types/course";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledChart from "../../chart/StyledChart";
import { GhostGuide } from "../../onboarding/GhostGuide";
import { Button } from "../../ui/Button";
import { Divider } from "../../ui/Divider";
import EmptyListView from "../../ui/EmptyListView";
import Section from "../../ui/Section";
import StatRow, { Stat } from "../../ui/StatRow";
import { StyledSwitch } from "../../ui/StyledSwitch";
import { Typography, TypographyColor } from "../../ui/Typography";
import { GhostRow } from "./GhostRow";
import UserStatItem from "./UserStatItem";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    course: CourseResponse | null;
}

export default function BottomCourseInfoModal({
    bottomSheetRef,
    course,
}: BottomCourseInfoModalProps) {
    const [ghostSelected, setGhostSelected] = useState(false);
    const { requestOrAlert, requestOptional } = useAppPermissions();
    const hasRunCourseRef = useRef(false);
    const [showGhostGuide, setShowGhostGuide] = useState(false);

    // 코스 러닝 쓴 적 있는지 로컬에 저장하고 없으면 false로 설정
    useEffect(() => {
        (async () => {
            const hasRunCourse = await AsyncStorage.getItem("hasRunCourse");
            if (hasRunCourse === "true") {
                hasRunCourseRef.current = true;
            } else {
                hasRunCourseRef.current = false;
            }
        })();
    }, []);

    useEffect(() => {
        if (course?.myGhostInfo) {
            setGhostSelected(true);
        }
    }, [course]);

    const courseStats = [
        {
            description: "전체 거리",
            value: ((course?.distance ?? 0) / 1000).toFixed(2),
            unit: "km",
        },
        {
            description: "상승 고도",
            value: course?.elevationGain.toString() ?? "--",
            unit: "m",
        },
        {
            description: "하강 고도",
            value: course?.elevationLoss
                ? Math.abs(course?.elevationLoss)
                : "0",
            unit: "m",
        },
    ];

    const ghostStats = [
        {
            description: "시간",
            value: getRunTime(course?.myGhostInfo?.duration ?? 0, "HH:MM:SS"),
        },
        {
            description: "페이스",
            value: getFormattedPace(course?.myGhostInfo?.averagePace ?? 0),
        },
        {
            description: "케이던스",
            value: course?.myGhostInfo?.cadence ?? 0,
            unit: "spm",
        },
    ];

    const router = useRouter();

    const handleRun = async () => {
        bottomSheetRef.current?.dismiss();
        if (
            ghostSelected &&
            course?.myGhostInfo &&
            course?.myGhostInfo.runningId !== -1
        ) {
            router.push(`/run/${course?.id}/${course?.myGhostInfo.runningId}`);
        } else {
            router.push(`/run/${course?.id}/-1`);
        }
    };

    if (!course) {
        return null;
    }

    return showGhostGuide ? (
        <GhostMakeGuide handleRun={handleRun} />
    ) : (
        <View>
            <CourseInfoSection
                courseName={course?.name ?? ""}
                stats={courseStats}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/profile/${course?.id}/detail`);
                }}
            />
            <View style={{ height: course?.myGhostInfo ? 20 : 30 }} />
            {course?.myGhostInfo && (
                <GhostSection
                    ghost={course?.myGhostInfo}
                    ghostSelected={ghostSelected}
                    onSwitchChange={setGhostSelected}
                    ghostStats={ghostStats}
                />
            )}
            <Button
                style={{
                    marginHorizontal: 16.5,
                }}
                type="active"
                title={ghostSelected ? "고스트와 러닝" : "이 코스로 러닝"}
                onPress={async () => {
                    const hk = await requestOptional("HEALTHKIT");

                    const ok = await requestOrAlert(
                        "SENSORS",
                        "러닝 중 측정을 위해 권한이 필요해요"
                    );

                    if (!ok) {
                        return;
                    }

                    if (!hasRunCourseRef.current) {
                        setShowGhostGuide(true);
                    } else {
                        handleRun();
                    }
                }}
            />
        </View>
    );
}

const GhostMakeGuide = ({ handleRun }: { handleRun: () => void }) => {
    const handleClose = async () => {
        await AsyncStorage.setItem("hasRunCourse", "true");
        handleRun();
    };
    return (
        <View style={{ gap: 35 }}>
            <Typography
                variant="sectionhead"
                color="white"
                style={{ textAlign: "center" }}
            >
                내 고스트가 필요한가요?{"\n"}기록을 고스트로 남기고 싶다면
                {"\n"}
                일시정지 없이 완주해야 해요
            </Typography>
            <Button
                style={{
                    marginHorizontal: 16.5,
                }}
                type="active"
                title="네, 확인했어요"
                onPress={handleClose}
            />
        </View>
    );
};

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
    const [show, setShow] = useState(false);
    return (
        <>
            <Section
                title="내 고스트"
                titleColor="white"
                containerStyle={styles.ghostInfoSection}
                onClickInfo={() => {
                    setShow(true);
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
                <GhostRow
                    profileUrl={ghost.profileUrl}
                    ghostStats={ghostStats}
                />
            </Section>
            <GhostGuide show={show} handleClose={() => setShow(false)} />
        </>
    );
};

const styles = StyleSheet.create({
    ghostInfoSection: {
        marginBottom: 30,
        marginHorizontal: 16.5,
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
                        gap: 20,
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
