import { StyleSheet, View } from "react-native";
import { Typography } from "./Typography";

interface StatsIndicatorProps {
    stats: { label: string; value: string; unit: string }[];
    color?: "gray20" | "gray40";
}

export default function StatsIndicator({
    stats,
    color = "gray40",
}: StatsIndicatorProps) {
    return (
        <View style={styles.courseInfoContainer}>
            {stats.map((stat) => (
                <View key={stat.label} style={styles.courseInfoItem}>
                    <View style={styles.courseInfoItemValue}>
                        <Typography variant="display1" color={color}>
                            {stat.value}
                        </Typography>
                        {stat.unit && (
                            <Typography variant="display2" color={color}>
                                {stat.unit}
                            </Typography>
                        )}
                    </View>
                    <Typography variant="body1" color="gray60">
                        {stat.label}
                    </Typography>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    courseInfoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 20,
    },
    courseInfoItem: {
        width: "33%",
        alignItems: "center",
    },
    courseInfoItemValue: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 1,
    },
});
