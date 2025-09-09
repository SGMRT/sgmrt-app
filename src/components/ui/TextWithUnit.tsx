import {
    FlexAlignType,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";

export interface TextWithUnitProps {
    value: string | number;
    unit?: string;
    description?: string;
    align?: FlexAlignType;
    color?: TypographyColor;
    unitColor?: TypographyColor;
    variant?: TypographyVariant;
    unitVariant?: TypographyVariant;
    style?: StyleProp<ViewStyle>;
    descriptionColor?: TypographyColor;
    descriptionVariant?: TypographyVariant;
}

export default function TextWithUnit({
    value,
    unit,
    description,
    align = "center",
    color = "gray40",
    variant = "subhead1",
    unitVariant,
    style,
    descriptionColor = "gray40",
    descriptionVariant = "body2",
}: TextWithUnitProps) {
    return (
        <View style={[styles.container, style, { alignItems: align }]}>
            <View style={styles.valueContainer}>
                <Typography variant={variant} color={color}>
                    {value}
                </Typography>
                {unit && (
                    <Typography
                        variant={unitVariant ? unitVariant : variant}
                        color={color}
                    >
                        {unit}
                    </Typography>
                )}
            </View>
            {description && (
                <Typography
                    variant={descriptionVariant}
                    color={descriptionColor}
                >
                    {description}
                </Typography>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
    },
    valueContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
});
