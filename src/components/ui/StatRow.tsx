import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Fragment } from "react/jsx-runtime";
import { Divider } from "./Divider";
import TextWithUnit from "./TextWithUnit";
import { TypographyColor, TypographyVariant } from "./Typography";

export type Stat = {
    value: string | number;
    unit?: string;
    description?: string;
};

interface StatRowProps {
    stats: Stat[];
    color?: TypographyColor;
    style?: StyleProp<ViewStyle>;
    variant?: TypographyVariant;
}

export default function StatRow({
    stats,
    style,
    variant,
    color = "gray40",
}: StatRowProps) {
    return (
        <View style={[styles.container, style]}>
            {stats.map((stat, idx) => (
                <Fragment key={`stat-${stat.description ?? stat.value}`}>
                    <TextWithUnit
                        value={stat.value}
                        unit={stat.unit}
                        align="flex-start"
                        description={stat.description}
                        variant={variant}
                        color={color}
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
