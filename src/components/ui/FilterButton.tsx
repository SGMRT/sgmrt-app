import { FilterIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";

interface FilterButtonProps {
    onPress: () => void;
    variant?: TypographyVariant;
    color?: TypographyColor;
    style?: StyleProp<ViewStyle>;
}

export const FilterButton = ({
    onPress,
    variant = "caption1",
    color = "gray40",
    style,
}: FilterButtonProps) => {
    return (
        <ButtonWithIcon
            icon={<FilterIcon />}
            title="필터"
            onPress={onPress}
            variant={variant}
            color={color}
            style={style}
        />
    );
};

interface ButtonWithIconProps {
    icon?: React.ReactNode;
    title: string;
    onPress: () => void;
    variant?: TypographyVariant;
    color?: TypographyColor;
    style?: StyleProp<ViewStyle>;
}

export const ButtonWithIcon = ({
    icon,
    title,
    onPress,
    variant = "caption1",
    color = "gray40",
    style,
}: ButtonWithIconProps) => {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
            <>
                {icon ? icon : null}
                <Typography variant={variant} color={color}>
                    {title}
                </Typography>
            </>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: "#171717",
        borderColor: colors.gray[80],
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
});
