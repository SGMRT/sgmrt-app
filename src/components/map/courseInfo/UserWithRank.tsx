import colors from "@/src/theme/colors";
import { Image, Pressable, View } from "react-native";
import { Divider } from "../../ui/Divider";
import { Typography } from "../../ui/Typography";

interface UserWithRankProps {
    rank: number;
    name: string;
    avatar: string;
    time: string;
    pace: string;
    cadence: string;
    ghostId: string;
    isGhostSelected: boolean;
    onPress: (ghostId: string) => void;
}

export default function UserWithRank({
    rank,
    name,
    avatar,
    time,
    pace,
    cadence,
    isGhostSelected,
    ghostId,
    onPress,
}: UserWithRankProps) {
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 15,
                backgroundColor: isGhostSelected ? "#171717" : "#111111",
                paddingHorizontal: 17,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 15,
                }}
            >
                <Typography
                    variant="body1"
                    color={isGhostSelected ? "primary" : "gray60"}
                >
                    {rank}
                </Typography>
                <Image
                    source={{
                        uri: avatar,
                    }}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 100,
                    }}
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
            <Pressable onPress={() => onPress(ghostId)}>
                <View
                    style={{
                        width: 20,
                        height: 20,
                        borderWidth: 1.5,
                        borderColor: isGhostSelected
                            ? colors.primary
                            : colors.gray[60],
                        borderRadius: 100,
                    }}
                />
            </Pressable>
        </View>
    );
}
