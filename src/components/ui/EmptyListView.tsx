import { AlertIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { View } from "react-native";
import { Typography } from "./Typography";

export default function EmptyListView({
    iconColor = colors.gray[60],
    description,
}: {
    description: string;
    iconColor?: string;
}) {
    return (
        <View style={{ gap: 15, alignItems: "center" }}>
            <AlertIcon color={iconColor} />
            <Typography
                variant="body2"
                color="gray40"
                style={{ textAlign: "center" }}
            >
                {description}
            </Typography>
        </View>
    );
}
