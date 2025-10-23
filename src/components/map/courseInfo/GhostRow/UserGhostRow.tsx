import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GhostIcon } from "@/assets/svgs/svgs";
import StatRow, { Stat } from "@/src/components/ui/StatRow";
import colors from "@/src/theme/colors";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { BaseGhostRow } from "./BaseGhostRow";

interface UserGhostRowProps {
    profileUrl: string;
    stats: Stat[];
    active?: boolean;
    onSelect?: () => void;
}

export const UserGhostRow = ({
    profileUrl,
    stats,
    active = false,
    onSelect,
}: UserGhostRowProps) => {
    const avatar = (
        <View style={{ position: "relative" }}>
            <Image
                source={profileUrl ? { uri: profileUrl } : DefaultProfileIcon}
                style={styles.avatar}
            />
            <GhostIcon
                style={styles.icon}
                color={active ? colors.primary : colors.white}
            />
        </View>
    );

    const statRow = (
        <StatRow
            stats={stats}
            color={active ? "gray20" : "gray60"}
            descriptionColor={active ? "gray40" : "gray60"}
            style={styles.stats}
        />
    );

    return (
        <BaseGhostRow
            active={active}
            avatar={avatar}
            stats={statRow}
            onSelect={onSelect}
        />
    );
};

const styles = StyleSheet.create({
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: "#333333",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    icon: {
        position: "absolute",
        bottom: 0,
        right: 0,
    },
    stats: {
        gap: 14,
    },
});
