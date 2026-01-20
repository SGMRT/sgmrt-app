import { Divider } from "@/src/components/ui";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, View } from "react-native";

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
        paddingVertical: 9,
        paddingLeft: 13.5,
        backgroundColor: "#222222",
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 13.5,
        borderWidth: 0.5,
        borderColor: "#222222",
    },
    ghostAvatarContainer: {
        position: "relative",
    },
    ghostStats: {
        gap: 14,
        flex: 1,
    },
    ghostRowActive: {
        borderColor: colors.primary,
    },
});
