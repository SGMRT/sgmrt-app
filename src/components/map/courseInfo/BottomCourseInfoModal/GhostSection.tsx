import Section from "@/src/components/ui/Section";
import { Stat } from "@/src/components/ui/StatRow";
import { StyledSwitch } from "@/src/components/ui/StyledSwitch";
import { StyleSheet, View } from "react-native";
import { AIGhostRow } from "../GhostRow/AIGhostRow";
import { CreateGhostyButton } from "../GhostRow/CreateGhostyButton";
import { UserGhostRow } from "../GhostRow/UserGhostRow";
import { GuideType } from "./BottomCourseInfoModal";

interface GhostSectionProps {
    userGhost: any;
    aiGhost?: any;
    onDeleteAiGhost?: () => void;
    selectedGhost: "user" | "ai" | null;
    onSwitchChange: (value: "user" | "ai" | null) => void;
    onClickGuide: (guideType: GuideType) => void;
    ghostStats: Stat[];
}

export const GhostSection = ({
    userGhost,
    aiGhost,
    onDeleteAiGhost,
    selectedGhost,
    onSwitchChange,
    ghostStats,
    onClickGuide,
}: GhostSectionProps) => {
    return (
        <Section
            title="내 고스트"
            titleColor="white"
            containerStyle={styles.ghostInfoSection}
            onClickInfo={() => onClickGuide("ghost")}
            titleRightChildren={
                userGhost && (
                    <StyledSwitch
                        isSelected={selectedGhost !== null}
                        onValueChange={(value) => {
                            onSwitchChange(value ? "user" : null);
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
                        name={aiGhost.name}
                        pace={aiGhost.pace}
                        isCreating={aiGhost.isCreating}
                        onDelete={onDeleteAiGhost ?? (() => {})}
                        active={selectedGhost === "ai"}
                        onSelect={() => onSwitchChange("ai")}
                    />
                ) : (
                    <CreateGhostyButton
                        onPress={() => onClickGuide("create")}
                        onClickGuide={() => onClickGuide("ghosty")}
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
