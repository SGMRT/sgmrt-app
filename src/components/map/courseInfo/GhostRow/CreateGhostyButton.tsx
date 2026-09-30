import { AddIcon, InfoIcon } from "@/assets/svgs/svgs";
import { Beta, Typography } from "@/src/components/ui";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BaseGhostRow } from "./BaseGhostRow";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";

interface CreateGhostyButtonProps {
    remainingCount?: number;
    onPress?: () => void;
    onClickGuide?: () => void;
}

export const CreateGhostyButton = ({
    remainingCount = 0,
    onPress,
    onClickGuide,
}: CreateGhostyButtonProps) => {
    return (
        <BaseGhostRow
            avatar={<Beta />}
            stats={
                <View>
                    <View style={styles.createGhostButtonText}>
                        <Typography variant="body2" color="gray40">
                            고스티 만들기
                        </Typography>
                        <TouchableOpacity onPress={onClickGuide}>
                            <InfoIcon color={darkTheme.ui07} />
                        </TouchableOpacity>
                    </View>
                    <Typography variant="caption1" color="gray60">
                        (일일 생성 가능 횟수 {remainingCount}/3)
                    </Typography>
                </View>
            }
            rightAccessory={
                <TouchableOpacity
                    disabled={remainingCount === 0}
                    onPress={onPress}
                    style={{ marginRight: spacing[12] }}
                >
                    <AddIcon color={darkTheme.ui07} />
                </TouchableOpacity>
            }
        />
    );
};

const styles = StyleSheet.create({
    createGhostButton: {
        backgroundColor: darkTheme.uiUp,
        borderRadius: radius.base,
        paddingVertical: spacing[8],
        paddingHorizontal: spacing[12],
        justifyContent: "space-between",
        flexDirection: "row",
    },
    createGhostButtonText: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
