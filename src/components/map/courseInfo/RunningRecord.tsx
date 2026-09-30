import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GhostIcon } from "@/assets/svgs/svgs";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Stat, StatRow, Typography } from "@/src/components/ui";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import { Divider } from "@/src/design-system/atoms/Divider";

export const RunningRecord = ({
    user,
    isMine,
    stats,
}: {
    user: any;
    isMine: boolean;
    stats: Stat[];
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Typography variant="subhead1" color="gray20">
                    {isMine ? "내 기록" : "고스트 기록"}
                </Typography>
                <Divider direction="horizontal" />
            </View>

            <View style={styles.row}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={
                            user.profileUrl
                                ? { uri: user.profileUrl }
                                : DefaultProfileIcon
                        }
                        style={styles.avatar}
                    />
                    {!isMine && (
                        <GhostIcon color={darkTheme.primary} style={styles.icon} />
                    )}
                </View>
                <Divider direction="vertical" />
                <StatRow
                    stats={stats}
                    color={isMine ? "primary" : "gray20"}
                    style={styles.stats}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: darkTheme.uiUp,
        borderRadius: radius.md,
        paddingHorizontal: spacing[12],
        paddingVertical: spacing[8],
        gap: spacing[12],
    },
    titleContainer: {
        gap: 4,
    },
    row: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[12],
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
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
