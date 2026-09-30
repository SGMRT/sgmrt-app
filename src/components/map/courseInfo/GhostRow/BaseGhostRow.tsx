import { Pressable, StyleSheet, View } from "react-native";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import { Divider } from "@/src/design-system/atoms/Divider";

interface BaseGhostRowProps {
    active?: boolean;
    avatar: React.ReactNode;
    stats: React.ReactNode;
    rightAccessory?: React.ReactNode;
    onSelect?: () => void;
}

export const BaseGhostRow = ({
    active,
    avatar,
    stats,
    rightAccessory,
    onSelect,
}: BaseGhostRowProps) => {
    return (
        <Pressable
            style={[styles.ghostRow, active && styles.ghostRowActive]}
            onPress={onSelect ?? (() => {})}
        >
            <View style={styles.ghostAvatarContainer}>{avatar}</View>
            <Divider direction="vertical" />
            <View style={styles.ghostStats}>{stats}</View>
            {rightAccessory && (
                <View style={{ marginLeft: "auto" }}>{rightAccessory}</View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    ghostRow: {
        paddingVertical: spacing[8],
        paddingLeft: spacing[12],
        backgroundColor: darkTheme.uiUp,
        borderRadius: radius.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[12],
        borderWidth: 0.5,
        borderColor: darkTheme.uiUp,
    },
    ghostAvatarContainer: {
        position: "relative",
    },
    ghostStats: {
        gap: spacing[12],
        flex: 1,
    },
    ghostRowActive: {
        borderColor: darkTheme.primary,
    },
});
