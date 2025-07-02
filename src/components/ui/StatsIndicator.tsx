import { StyleSheet, View } from "react-native";
import TextWithUnit from "./TextWithUnit";

interface StatsIndicatorProps {
    stats: { label: string; value: string | number; unit: string }[];
    color?: "gray20" | "gray40";
}

export default function StatsIndicator({
    stats,
    color = "gray40",
}: StatsIndicatorProps) {
    return (
        <View style={styles.courseInfoContainer}>
            {stats.map((stat) => (
                <TextWithUnit
                    value={stat.value.toString()}
                    unit={stat.unit}
                    description={stat.label}
                    variant="display1"
                    color={color}
                    unitVariant="display2"
                    key={stat.label}
                    style={styles.courseInfoItem}
                />
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
});
