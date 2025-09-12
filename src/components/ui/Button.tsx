import colors from "@/src/theme/colors";
import {
    Pressable,
    PressableProps,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "./Typography";

type ButtonType =
    | "active"
    | "inactive"
    | "red"
    | "dark-active"
    | "dark-inactive"
    | "custom";

export interface ButtonProps extends PressableProps {
    type?: ButtonType;
    icon?: React.ReactNode;
    title: string;
    variant?: TypographyVariant;
    customColor?: TypographyColor;
    customBackgroundColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    topStroke?: boolean;
}

export const Button = ({
    type = "active",
    title,
    variant = "subhead2",
    customColor,
    icon,
    customBackgroundColor,
    containerStyle,
    style,
    topStroke = false,
    ...props
}: ButtonProps) => {
    const resolvedType: ButtonType =
        type === "custom" || customBackgroundColor || customColor
            ? "custom"
            : type;

    const { backgroundColor, textColor } = getButtonStyle(resolvedType, {
        customBackgroundColor,
        customColor,
    });

    return (
        <View
            style={[
                styles.container,
                topStroke && styles.topStroke,
                containerStyle,
            ]}
        >
            <Pressable
                {...props}
                style={[styles.base, { backgroundColor }, style]}
            >
                {icon}
                <Typography
                    variant={variant}
                    color={textColor as TypographyColor}
                >
                    {title}
                </Typography>
            </Pressable>
        </View>
    );
};

function getButtonStyle(
    type: ButtonType,
    opts: { customBackgroundColor?: string; customColor?: TypographyColor }
) {
    switch (type) {
        case "active":
            return { backgroundColor: colors.primary, textColor: "black" };
        case "inactive":
            return {
                backgroundColor: colors.gray[80],
                textColor: "white",
            };
        case "red":
            return { backgroundColor: colors.red, textColor: "white" };
        case "dark-active":
            return { backgroundColor: "#171717", textColor: "primary" };
        case "dark-inactive":
            return {
                backgroundColor: "#171717",
                textColor: "gray40",
            };
        case "custom":
            return {
                backgroundColor: opts.customBackgroundColor ?? "transparent",
                textColor: opts.customColor ?? "white",
            };
        default:
            return {
                backgroundColor: colors.gray[80],
                textColor: "white",
            };
    }
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 12,
        height: 70,
    },
    base: {
        flex: 1,
        maxHeight: 58,
        height: 58,
        borderRadius: 16,
        marginHorizontal: 16.5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    topStroke: {
        borderTopWidth: 1,
        borderColor: "#212121",
    },
});
