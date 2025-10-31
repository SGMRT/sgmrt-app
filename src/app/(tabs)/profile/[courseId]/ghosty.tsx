import { Breeze } from "@/assets/icons/icons";
import { FlagIcon, TimerIcon, VoltIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getPacemakerByCourseId,
    getPacemakerDetail,
} from "@/src/apis";
import IntervalTimeline from "@/src/components/chart/interval/IntervalTimeline";
import { Button } from "@/src/components/ui/Button";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import Section from "@/src/components/ui/Section";
import { Typography } from "@/src/components/ui/Typography";
import { convertToName } from "@/src/features/pacemaker/utils/convertToName";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ghosty() {
    const { courseId } = useLocalSearchParams();
    const router = useRouter();

    const { data: course } = useQuery({
        queryKey: ["course", Number(courseId)],
        queryFn: () => getCourse(Number(courseId)),
    });

    const { data: pacemakerSummary } = useQuery({
        queryKey: ["pacemaker", Number(courseId)],
        queryFn: () => getPacemakerByCourseId(Number(courseId)),
    });

    const { data: pacemakerDetail } = useQuery({
        queryKey: [
            "pacemakerDetail",
            pacemakerSummary?.pacemakerSummaryResponse.id!,
        ],
        queryFn: () =>
            getPacemakerDetail(pacemakerSummary?.pacemakerSummaryResponse.id!),
        enabled: !!pacemakerSummary?.pacemakerSummaryResponse.id,
    });

    // useMemo
    const ghostyName = useMemo(() => {
        return convertToName(
            pacemakerSummary?.pacemakerSummaryResponse.runningType
        );
    }, [pacemakerSummary?.pacemakerSummaryResponse.runningType]);

    return (
        <SafeAreaView style={styles.flexibleContainer}>
            <Header titleText={course?.name ?? ""} />
            <ScrollView
                contentContainerStyle={styles.scrollViewContentContainer}
                style={styles.flexibleContainer}
            >
                <View style={styles.ghostyContainer}>
                    <Typography variant="headline" color="white">
                        {ghostyName}가 생성되었어요
                    </Typography>
                    <View style={styles.ghostyImageContainer}>
                        <Image source={Breeze} style={styles.ghostyImage} />
                    </View>
                </View>
                {/* <Section containerStyle={styles.ghostyMessageContainer}>
                    <Typography
                        variant="body1"
                        color="gray20"
                        style={styles.ghostyMessageText}
                    >
                        아직은 어린 고스티예요{"\n"}
                        러닝을 즐기다 보면{"\n"}
                        어느새 성장해있을지도 몰라요!
                    </Typography>
                </Section> */}
                <Section
                    title={(course?.name ?? "") + " 플랜"}
                    titleColor="white"
                    titleVariant="sectionhead"
                    containerStyle={styles.planContainer}
                    style={styles.planStyle}
                    centerTitle
                >
                    <PlanSummary
                        distanceKm={
                            pacemakerDetail?.pacemakerResponse.goalKm ?? 0
                        }
                        estimatedTime={
                            pacemakerDetail?.pacemakerResponse
                                .expectedMinutes ?? 0
                        }
                        pace={pacemakerDetail?.pacemakerResponse.pace ?? 0}
                    />
                    {pacemakerDetail?.pacemakerResponse && (
                        <PlanSection style={styles.planInterval}>
                            <IntervalTimeline
                                pacemaker={pacemakerDetail?.pacemakerResponse}
                            />
                        </PlanSection>
                    )}
                    <PlanSection>
                        <Typography
                            variant="caption1"
                            color="gray20"
                            style={{ textAlign: "center" }}
                        >
                            {pacemakerDetail?.pacemakerResponse.runningTip}
                        </Typography>
                    </PlanSection>
                </Section>
            </ScrollView>
            <Button
                title="고스티와 러닝 시작"
                onPress={() => {
                    router.push({
                        pathname: "/run/[courseId]/[ghostRunningId]",
                        params: {
                            courseId: courseId as string,
                            ghostRunningId: "-1",
                            ghostyId:
                                pacemakerSummary?.pacemakerSummaryResponse.id,
                        },
                    });
                }}
                topStroke
            />
        </SafeAreaView>
    );
}

const PlanSummary = ({
    distanceKm,
    estimatedTime,
    pace,
}: {
    distanceKm: number;
    estimatedTime: number;
    pace: number;
}) => {
    return (
        <PlanSection style={styles.planSummarySection}>
            <PlanItem
                icon={<FlagIcon />}
                value={distanceKm.toFixed(1).toString()}
                description="거리(km)"
            />
            <Divider direction="vertical" />
            <PlanItem
                icon={<TimerIcon />}
                value={getRunTime(Math.floor(estimatedTime * 60), "HH:MM:SS")}
                description="예상 시간"
            />

            <Divider direction="vertical" />
            <PlanItem
                icon={<VoltIcon />}
                value={getFormattedPace(Math.floor(pace * 60))}
                description="최고 페이스"
            />
        </PlanSection>
    );
};

const PlanSection = ({
    style,
    children,
}: {
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}) => {
    return <View style={[styles.planSection, style]}>{children}</View>;
};

const PlanItem = ({
    icon,
    value,
    description,
}: {
    icon: React.ReactNode;
    value: string;
    description: string;
}) => {
    return (
        <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                {icon && icon}
                <Typography variant="subhead1" color="gray20">
                    {value}
                </Typography>
            </View>
            <Typography variant="body2" color="gray60">
                {description}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    planSection: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: "#222222",
        borderRadius: 8,
    },
    planSummarySection: {
        gap: 13.5,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    scrollViewContentContainer: {
        marginTop: 20,
        marginBottom: 8,
        alignItems: "center",
        marginHorizontal: 16.5,
    },
    flexibleContainer: {
        flex: 1,
    },
    ghostyContainer: {
        width: "100%",
        alignItems: "center",
    },
    ghostyImageContainer: {
        alignItems: "center",
        marginHorizontal: 95,
    },
    ghostyImage: {
        width: "100%",
        aspectRatio: 1.46,
        resizeMode: "contain",
    },
    ghostyMessageContainer: {
        width: "100%",
        marginBottom: 20,
        alignItems: "center",
    },
    ghostyMessageText: {
        textAlign: "center",
    },
    planContainer: {
        width: "100%",
    },
    planStyle: {
        gap: 20,
    },
    planInterval: {
        paddingBottom: 18,
    },
});
