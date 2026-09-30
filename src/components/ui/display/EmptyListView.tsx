import { AlertIcon } from "@/assets/svgs/svgs";
import { View } from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";
import { darkTheme } from "@/src/design-system/themes/dark";

export default function EmptyListView({
    iconColor = darkTheme.ui04,
    description,
    fontSize = "body2",
    fontColor = "gray40",
}: {
    description: string;
    iconColor?: string;
    fontSize?: TypographyVariant;
    fontColor?: TypographyColor;
}) {
    return (
        <View style={{ gap: 15, alignItems: "center" }}>
            <AlertIcon color={iconColor} />
            <Typography
                variant={fontSize}
                color={fontColor}
                style={{ textAlign: "center" }}
            >
                {description}
            </Typography>
        </View>
    );
}
