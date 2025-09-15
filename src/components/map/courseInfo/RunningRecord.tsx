import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GhostIcon } from "@/assets/svgs/svgs";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Divider } from "../../ui/Divider";
import StatRow, { Stat } from "../../ui/StatRow";
import { Typography } from "../../ui/Typography";

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
                    {!isMine && <GhostIcon style={styles.icon} />}
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
        backgroundColor: "#222222",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 14,
    },
    titleContainer: {
        gap: 4,
    },
    row: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 100,
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
