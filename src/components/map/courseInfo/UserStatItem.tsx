import colors from "@/src/theme/colors";
import { memo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Divider } from "../../ui/Divider";
import { Typography } from "../../ui/Typography";

interface UserStatItemProps {
    rank?: number;
    name: string;
    avatar: string;
    time: string;
    pace: string;
    cadence: string;
    ghostId?: string;
    isGhostSelected: boolean;
    onPress?: (ghostId: string) => void;
    isMyRecord?: boolean;
    paddingHorizontal?: boolean;
    backgroundColor?: boolean;
}

export default memo(function UserStatItem({
    rank,
    name,
    avatar,
    time,
    pace,
    cadence,
    isGhostSelected,
    ghostId,
    isMyRecord,
    onPress,
    paddingHorizontal = true,
    backgroundColor = true,
}: UserStatItemProps) {
    return (
        <View
            style={[
                styles.container,
                paddingHorizontal && {
                    paddingHorizontal: 17,
                },
                {
                    backgroundColor: backgroundColor
                        ? isGhostSelected
                            ? "#171717"
                            : "#111111"
                        : "transparent",
                },
            ]}
        >
            <View style={styles.textContainer}>
                {rank && (
                    <Typography
                        variant="body1"
                        color={isGhostSelected ? "primary" : "gray60"}
                    >
                        {rank}
                    </Typography>
                )}
                <Image
                    source={{
                        uri: avatar,
                    }}
                    style={styles.avatar}
                />
                <View>
                    <Typography variant="body1" color="gray60">
                        {name}
                    </Typography>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography
                            variant="body1"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {time}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {pace}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {cadence}
                        </Typography>
                    </View>
                </View>
            </View>
            <Pressable onPress={() => onPress?.(ghostId ?? "")}>
                <View
                    style={[
                        styles.rankContainer,
                        {
                            backgroundColor: isMyRecord
                                ? isGhostSelected
                                    ? colors.primary
                                    : colors.gray[60]
                                : "transparent",
                            borderColor: isGhostSelected
                                ? colors.primary
                                : colors.gray[60],
                            borderWidth: 1.5,
                        },
                    ]}
                >
                    {isMyRecord && (
                        <Text
                            style={{
                                color: colors.black,
                                fontFamily: "SpoqaHanSansNeo-Bold",
                                fontSize: 12,
                            }}
                        >
                            나
                        </Text>
                    )}
                </View>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
    },
    textContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 100,
    },
    rankContainer: {
        width: 20,
        height: 20,
        borderRadius: 100,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
});
