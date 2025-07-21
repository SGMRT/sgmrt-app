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
}: UserStatItemProps) {
    return (
        <View
            style={[
                styles.container,
                paddingHorizontal && {
                    paddingHorizontal: 17,
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
                        variant="body1"
                        color={isGhostSelected ? "primary" : "gray60"}
                    >
                        {rank}
                    </Typography>
                )}
                <Image
                    source={avatar ? { uri: avatar } : DefaultProfileIcon}
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
});
