import Section from "@/src/components/ui/Section";
import { Stat } from "@/src/components/ui/StatRow";
import { StyledSwitch } from "@/src/components/ui/StyledSwitch";
import { StyleSheet, View } from "react-native";
import { GhostRow } from "../GhostRow";
import { GuideType } from "./BottomCourseInfoModal";
import { CreateGhostyButton } from "./CreateGhostyButton";

interface GhostSectionProps {
    ghost: any;
    ghostSelected: boolean;
    onSwitchChange: (value: boolean) => void;
    onClickGuide: (guideType: GuideType) => void;
    ghostStats: Stat[];
}

export const GhostSection = ({
    ghost,
    ghostSelected,
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
                ghost && (
                    <StyledSwitch
                        isSelected={ghostSelected}
                        onValueChange={(value) => {
                            onSwitchChange(value);
                        }}
                    />
                )
            }
        >
            <View style={styles.ghostSectionContent}>
                {ghost && (
                    <GhostRow
                        profileUrl={ghost.profileUrl}
                        ghostStats={ghostStats}
                    />
                )}
                <CreateGhostyButton
                    onPress={() => onClickGuide("create")}
                    onClickGuide={() => onClickGuide("ghosty")}
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
    ghostSectionContent: {
        gap: 20,
    },
});
