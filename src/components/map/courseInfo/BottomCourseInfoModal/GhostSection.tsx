import { getGhostyRateLimit } from "@/src/apis";
import { PacemakerByCourseIdResponse } from "@/src/apis/types/ghosty";
import Section from "@/src/components/ui/Section";
import { Stat } from "@/src/components/ui/StatRow";
import { StyledSwitch } from "@/src/components/ui/StyledSwitch";
import { convertToName } from "@/src/features/pacemaker/utils/convertToName";
import { getFormattedPace } from "@/src/utils/runUtils";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AIGhostRow } from "../GhostRow/AIGhostRow";
import { CreateGhostyButton } from "../GhostRow/CreateGhostyButton";
import { UserGhostRow } from "../GhostRow/UserGhostRow";
import { GuideType } from "./BottomCourseInfoModal";

interface GhostSectionProps {
    courseId: number;
    userGhost: any;
    aiGhost?: PacemakerByCourseIdResponse | null;
    onDeleteAiGhost?: () => void;
    selectedGhost: "user" | "ai" | null;
    onSwitchChange: (value: "user" | "ai" | null) => void;
    onClickGuide: (guideType: GuideType) => void;
    ghostStats: Stat[];
}

export const GhostSection = ({
    courseId,
    userGhost,
    aiGhost,
    onDeleteAiGhost,
    selectedGhost,
    onSwitchChange,
    ghostStats,
    onClickGuide,
}: GhostSectionProps) => {
    const [remainingCount, setRemainingCount] = useState(0);
    const ghostyName = useMemo(() => {
        return convertToName(aiGhost?.pacemakerSummaryResponse?.runningType);
    }, [aiGhost?.pacemakerSummaryResponse?.runningType]);

    useEffect(() => {
        getGhostyRateLimit().then((response) => {
            setRemainingCount(response.count);
        });
    }, []);

    return (
        <Section
            title="내 고스트"
            titleColor="white"
            containerStyle={styles.ghostInfoSection}
            onClickInfo={() => onClickGuide("ghost")}
            titleRightChildren={
                (userGhost || aiGhost?.processingStatus === "COMPLETED") && (
                    <StyledSwitch
                        isSelected={selectedGhost !== null}
                        onValueChange={(value) => {
                            onSwitchChange(
                                value ? (userGhost ? "user" : "ai") : null
                            );
                        }}
                    />
                )
            }
        >
            <View style={styles.ghostSectionContent}>
                {userGhost && (
                    <UserGhostRow
                        profileUrl={userGhost.profileUrl}
                        stats={ghostStats}
                        active={selectedGhost === "user"}
                        onSelect={() => onSwitchChange("user")}
                    />
                )}
                {aiGhost ? (
                    <AIGhostRow
                        courseId={courseId}
                        name={ghostyName}
                        pace={getFormattedPace(
                            (aiGhost.pacemakerSummaryResponse?.pace ?? 0) * 60
                        )}
                        isCreating={aiGhost.processingStatus === "PROCEEDING"}
                        onDelete={onDeleteAiGhost ?? (() => {})}
                        active={
                            selectedGhost === "ai" &&
                            aiGhost.processingStatus === "COMPLETED"
                        }
                        onSelect={() => {
                            if (aiGhost.processingStatus === "COMPLETED") {
                                onSwitchChange("ai");
                            }
                        }}
                    />
                ) : (
                    <CreateGhostyButton
                        onPress={() => onClickGuide("create")}
                        onClickGuide={() => onClickGuide("ghosty")}
                        remainingCount={remainingCount}
                    />
                )}
            </View>
        </Section>
    );
};

const styles = StyleSheet.create({
    ghostInfoSection: {
        marginBottom: 30,
        marginHorizontal: 16.5,
    },
    ghostSectionContent: {
        gap: 10,
    },
});
