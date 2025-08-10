import { DefaultProfileIcon } from "@/assets/icons/icons";
import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Divider } from "../../ui/Divider";
import RadioButton from "../../ui/RadioButton";
import { Typography } from "../../ui/Typography";

interface UserStatItemProps {
    rank?: number | string;
    name: string;
    avatar: string;
    time: string;
    pace: string;
    cadence: number | string;
    ghostId?: string;
    isGhostSelected: boolean;
    onPress?: (ghostId: string) => void;
    isMyRecord?: boolean;
    paddingHorizontal?: boolean;
    paddingVertical?: boolean;
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
    paddingVertical = true,
}: UserStatItemProps) {
    return (
        <View
            style={[
                styles.container,
                paddingHorizontal && {
                    paddingHorizontal: 17,
                },
                paddingVertical && {
                    paddingVertical: 15,
                },
                {
                    backgroundColor: isGhostSelected
                        ? "#171717"
                        : "transparent",
                },
            ]}
        >
            <View style={styles.textContainer}>
                {rank && (
                    <Typography
                        variant="caption1"
                        color={isGhostSelected ? "primary" : "gray60"}
                    >
                        {rank}
                    </Typography>
                )}
                <Image
                    source={
                        avatar
                            ? { uri: avatar.split("?X-Amz-")[0] }
                            : DefaultProfileIcon
                    }
                    style={styles.avatar}
                />
                <View>
                    <Typography variant="subhead1" color="gray40">
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
                            variant="body2"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {time}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body2"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {pace}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body2"
                            color={isGhostSelected ? "gray40" : "gray60"}
                        >
                            {cadence}
                        </Typography>
                    </View>
                </View>
            </View>
            <RadioButton
                isSelected={isGhostSelected}
                showMyRecord={isMyRecord}
                onPress={() => onPress?.(ghostId ?? "")}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
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
});
