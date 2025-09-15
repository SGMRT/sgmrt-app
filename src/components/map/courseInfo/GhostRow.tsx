import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GhostIcon } from "@/assets/svgs/svgs";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Divider } from "../../ui/Divider";
import StatRow, { Stat } from "../../ui/StatRow";

interface GhostRowProps {
    profileUrl: string;
    ghostStats: Stat[];
}

export const GhostRow = ({ profileUrl, ghostStats }: GhostRowProps) => {
    return (
        <View style={styles.ghostRow}>
            <View style={styles.ghostAvatarContainer}>
                <Image
                    source={
                        profileUrl ? { uri: profileUrl } : DefaultProfileIcon
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
    );
};

const styles = StyleSheet.create({
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
