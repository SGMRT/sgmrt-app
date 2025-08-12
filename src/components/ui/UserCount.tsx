import { ChevronIcon, UserIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { TouchableOpacity, View } from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";

interface UserCountProps {
    userCount: number;
    onPress?: () => void;
    color?: TypographyColor;
    variant?: TypographyVariant;
    iconColor?: string;
}

export const UserCount = ({
    userCount,
    onPress,
    color = "gray40",
    variant = "body3",
    iconColor = colors.gray[40],
}: UserCountProps) => {
    return (
        <TouchableOpacity
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
            }}
            onPress={onPress}
            disabled={!onPress}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <UserIcon color={iconColor} />
                <Typography variant={variant} color={color}>
                    {userCount}
                </Typography>
            </View>
            {onPress && (
                <ChevronIcon color={iconColor} width={18} height={18} />
            )}
        </TouchableOpacity>
    );
};
