import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GhostIcon } from "@/assets/svgs/svgs";
import { Stat, StatRow } from "@/src/components/ui";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { BaseGhostRow } from "./BaseGhostRow";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { core } from "@/src/design-system/tokens/colors";
import { spacing } from "@/src/design-system/tokens/spacing";

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
                color={active ? darkTheme.primary : core.white}
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
        borderRadius: radius.full,
        backgroundColor: darkTheme.uiUp,
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    icon: {
        position: "absolute",
        bottom: 0,
        right: 0,
    },
    stats: {
        gap: spacing[12],
    },
});
