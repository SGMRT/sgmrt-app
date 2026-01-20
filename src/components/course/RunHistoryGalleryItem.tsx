import { DefaultLogo } from "@/assets/icons/icons";
import { ChevronIcon, GhostIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Divider, Typography } from "@/src/components/ui";

export interface RunHistoryGalleryItemProps {
    mode: "SOLO" | "GHOST";
    imageUrl: string;
    name: string;
    courseName: string | null;
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    onShowHistory: () => void;
    isSelected: boolean;
    startedAt: number;
    selectedFilter: "date" | "course";
}

export const RunHistoryGalleryItem = ({
    mode,
    imageUrl,
    name,
    courseName,
    distance,
    duration,
    averagePace,
    cadence,
    onShowHistory,
    isSelected,
    startedAt,
    selectedFilter,
}: RunHistoryGalleryItemProps) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onShowHistory}>
            <View style={styles.imageContainer}>
                {mode === "GHOST" && (
                    <View style={styles.iconContainer}>
                        <GhostIcon
                            width={20}
                            height={12}
                            color={colors.primary}
                        />
                    </View>
                )}

                <Image
                    source={imageUrl ? { uri: imageUrl } : DefaultLogo}
                    style={styles.image}
                />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.contentHeader}>
                    <View style={styles.nameContainer}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flex: 1,
                            }}
                        >
                            <Typography
                                variant="subhead1"
                                color={isSelected ? "primary" : "gray20"}
                            >
                                {name}
                            </Typography>
                            <ChevronIcon color={colors.gray[40]} />
                        </View>
                    </View>
                </View>
                <View>
                    <View style={styles.content}>
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {distance.toFixed(2)}km
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {getRunTime(duration, "HH:MM:SS_IF_HH_EXISTS")}
                        </Typography>
                    </View>
                    <View style={styles.content}>
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {getFormattedPace(averagePace)}
                        </Typography>
                        <Divider />
                        <Typography
                            variant="body1"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {cadence}spm
                        </Typography>
                    </View>
                    <View style={styles.dateContainer}>
                        <Typography
                            variant="body3"
                            color={isSelected ? "gray20" : "gray40"}
                        >
                            {selectedFilter === "date"
                                ? courseName ?? ""
                                : getDate(startedAt)}
                        </Typography>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 20,
        alignItems: "center",
    },
    imageContainer: {
        backgroundColor: colors.gray[80],
        width: 120,
        height: 120,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 10,
    },
    contentContainer: {
        gap: 5,
        flex: 1,
    },
    contentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(226, 255, 0, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        left: 4,
        top: 4,
        zIndex: 10,
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
