import { Breeze } from "@/assets/icons/icons";
import { FlagIcon, TimerIcon, VoltIcon } from "@/assets/svgs/svgs";
import IntervalTimeline from "@/src/components/chart/IntervalTimeline";
import { Button } from "@/src/components/ui/Button";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import Section from "@/src/components/ui/Section";
import { Typography } from "@/src/components/ui/Typography";
import { Pacemaker } from "@/src/types/pacemaker";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { Image } from "expo-image";
import { useState } from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const pacemaker: Pacemaker = {
    summary: "소고기마라탕 플랜",
    goalKm: 12.1,
    expectedTime: 60,
    initialMessage: "아직은 어린 고스티예요",
    sets: [
        {
            setNum: 1,
            message: "warmup",
            run: { startKm: 0, endKm: 0.5, paceMinKm: 6.5 },
        },
        {
            setNum: 2,
            message: "훈련에 대한 설명",
            run: { startKm: 0.3, endKm: 11.6, paceMinKm: 4.8 },
        },
        {
            setNum: 3,
            message: "cooldown",
            run: { startKm: 11.6, endKm: 12.1, paceMinKm: 5.5 },
        },
    ],
};

export default function Ghosty() {
    const [plan, setPlan] = useState<Pacemaker>(pacemaker);
    return (
        <SafeAreaView style={styles.flexibleContainer}>
            <Header titleText="소고기마라탕" />
            <ScrollView
                contentContainerStyle={styles.scrollViewContentContainer}
                style={styles.flexibleContainer}
            >
                <View style={styles.ghostyContainer}>
                    <Typography variant="headline" color="white">
                        브리즈가 생성되었어요
                    </Typography>
                    <Image source={Breeze} style={styles.ghostyImage} />
                </View>
                <Section containerStyle={styles.ghostyMessageContainer}>
                    <Typography
                        variant="body1"
                        color="gray20"
                        style={styles.ghostyMessageText}
                    >
                        아직은 어린 고스티예요{"\n"}
                        러닝을 즐기다 보면{"\n"}
                        어느새 성장해있을지도 몰라요!
                    </Typography>
                </Section>
                <Section
                    title="소고기마라탕 플랜"
                    titleColor="white"
                    titleVariant="sectionhead"
                    containerStyle={styles.planContainer}
                    style={styles.planStyle}
                    centerTitle
                >
                    <PlanSummary
                        distanceKm={plan.goalKm}
                        estimatedTime={plan.expectedTime * 60}
                        pace={plan.expectedTime / plan.goalKm}
                    />
                    <PlanSection style={styles.planInterval}>
                        <IntervalTimeline sets={plan.sets} />
                    </PlanSection>
                </Section>
            </ScrollView>
            <Button title="고스티와 러닝 시작" onPress={() => {}} topStroke />
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
                value={getRunTime(Math.floor(estimatedTime), "MM:SS")}
                description="예상 시간"
            />

            <Divider direction="vertical" />
            <PlanItem
                icon={<VoltIcon />}
                value={getFormattedPace(Math.floor(pace * 60))}
                description="페이스"
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
        paddingHorizontal: 62,
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
