import { GhostIcon, ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Divider, Typography } from "@/src/components/ui";

export interface RunHistoryItemProps {
    mode: "SOLO" | "GHOST";
    name: string;
    courseName: string | null;
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    onShowHistory: () => void;
    isSelected: boolean;
}

export const RunHistoryItem = ({
    mode,
    name,
    courseName,
    distance,
    duration,
    averagePace,
    cadence,
    onShowHistory,
    isSelected,
}: RunHistoryItemProps) => {
    return (
        <TouchableOpacity style={styles.itemContainer} onPress={onShowHistory}>
            <View style={{ gap: 2 }}>
                <View style={styles.nameContainer}>
                    {mode === "GHOST" && (
                        <View style={styles.iconCompactContainer}>
                            <GhostIcon
                                width={13}
                                height={8.13}
                                color={colors.primary}
                            />
                        </View>
                    )}
                    <Typography
                        variant="subhead1"
                        color={isSelected ? "primary" : "gray20"}
                    >
                        {name}
                    </Typography>
                    <TouchableOpacity
                        onPress={onShowHistory}
                        style={styles.dateContainer}
                    >
                        {courseName && (
                            <View style={styles.nameContainer}>
                                <Divider />
                                <Typography
                                    variant="caption1"
                                    color={isSelected ? "gray20" : "gray40"}
                                >
                                    {courseName}
                                </Typography>
                            </View>
                        )}
                        <ChevronIcon
                            color={
                                isSelected ? colors.gray[20] : colors.gray[40]
                            }
                            width={18}
                            height={18}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {distance.toFixed(2)}km
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {getRunTime(duration, "HH:MM:SS_IF_HH_EXISTS")}
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {getFormattedPace(averagePace)}
                    </Typography>
                    <Divider />
                    <Typography
                        variant="body2"
                        color={isSelected ? "gray20" : "gray40"}
                    >
                        {cadence}spm
                    </Typography>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    iconCompactContainer: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: "rgba(226, 255, 0, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
