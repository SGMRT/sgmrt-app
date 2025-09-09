import { AlertIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { View } from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";

export default function EmptyListView({
    iconColor = colors.gray[60],
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
