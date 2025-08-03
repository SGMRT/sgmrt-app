import { ChevronIcon, UserIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Divider } from "../../ui/Divider";
import RadioButton from "../../ui/RadioButton";
import StatRow from "../../ui/StatRow";
import { Typography } from "../../ui/Typography";

interface CourseInfoItemProps {
    isSelected: boolean;
    onPress: () => void;
    distance: number;
    duration: number;
    averagePace: number;
    cadence: number;
    runnerCount: number | null;
    courseName: string | null;
    courseId: number | null;
    runningId: number | null;
    ghostRunningId: number | null;
    startedAt: number | null;
    historyName: string | null;
}

export default function CourseInfoItem({
    isSelected,
    onPress,
    distance,
    duration,
    averagePace,
    cadence,
    runnerCount,
    courseName,
    courseId,
    runningId,
    ghostRunningId,
    startedAt,
    historyName,
}: CourseInfoItemProps) {
    return (
        <View
            style={[
                styles.container,
                { backgroundColor: isSelected ? "#171717" : "transparent" },
            ]}
        >
            <View style={styles.leftSection}>
                <HistoryHeader
                    historyName={historyName ?? ""}
                    historyDate={getDate(startedAt ?? 0)}
                    courseName={courseName ?? ""}
                    courseUserCount={runnerCount ?? null}
                    courseId={courseId ?? -1}
                    runningId={runningId ?? -1}
                    ghostRunningId={ghostRunningId ?? -1}
                />
                <StatRow
                    style={{
                        gap: 10,
                    }}
                    stats={[
                        {
                            value: distance.toFixed(2),
                            unit: "km",
                        },
                        {
                            value: getRunTime(duration, "HH:MM:SS"),
                        },
                        {
                            value: getFormattedPace(averagePace),
                            unit: "",
                        },
                        {
                            value: cadence,
                            unit: "spm",
                        },
                    ]}
                    variant="body1"
                />
            </View>
            <RadioButton
                isSelected={isSelected}
                showMyRecord={false}
                onPress={onPress}
            />
        </View>
    );
}

interface HistoryHeaderProps {
    historyName: string;
    historyDate: string;
    courseName: string;
    courseUserCount: number | null;
    courseId: number | null;
    runningId: number | null;
    ghostRunningId: number | null;
}

const HistoryHeader = ({
    historyName,
    historyDate,
    courseName,
    courseUserCount,
    courseId,
    runningId,
    ghostRunningId,
}: HistoryHeaderProps) => {
    const router = useRouter();
    return (
        <View style={styles.headerContainer}>
            <Typography variant="body1" color="white">
                {historyName}
            </Typography>
            <TouchableOpacity
                disabled={runningId === -1}
                onPress={() => {
                    router.push(
                        `/result/${runningId}/${courseId}/${ghostRunningId}`
                    );
                }}
            >
                <View style={styles.titleRightSection}>
                    <Typography variant="caption1" color="gray60">
                        {historyDate}
                    </Typography>
                    {courseUserCount !== undefined &&
                        courseUserCount !== null && (
                            <>
                                <Divider />
                                <View style={styles.userCountContainer}>
                                    <UserIcon />
                                    <Typography
                                        variant="caption1"
                                        color="gray60"
                                    >
                                        {courseUserCount}
                                    </Typography>
                                </View>
                            </>
                        )}
                    {courseName !== "" && (
                        <>
                            <Divider />
                            <Typography variant="caption1" color="gray60">
                                {courseName}
                            </Typography>
                        </>
                    )}
                    {runningId !== -1 && (
                        <ChevronIcon
                            color={colors.gray[60]}
                            width={16}
                            height={16}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 10,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 17,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    leftSection: {
        gap: 2,
    },
    titleRightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    userCountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
