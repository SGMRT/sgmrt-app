import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Fragment } from "react/jsx-runtime";
import { Divider } from "./Divider";
import TextWithUnit from "./TextWithUnit";

export type Stat = {
    value: string;
    unit?: string;
    description: string;
};

interface StatRowProps {
    stats: Stat[];
    style?: StyleProp<ViewStyle>;
}

export default function StatRow({ stats, style }: StatRowProps) {
    return (
        <View style={[styles.container, style]}>
            {stats.map((stat, idx) => (
                <Fragment key={`stat-${stat.description}`}>
                    <TextWithUnit
                        value={stat.value}
                        unit={stat.unit}
                        align="flex-start"
                        description={stat.description}
                    />
                    {idx < stats.length - 1 && <Divider />}
                </Fragment>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
    },
});
