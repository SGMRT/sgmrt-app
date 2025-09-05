import colors from "@/src/theme/colors";
import { Pressable, PressableProps, StyleSheet } from "react-native";
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
    topStroke?: boolean;
}

export const Button = ({
    type = "active",
    title,
    variant = "subhead2",
    customColor,
    icon,
    customBackgroundColor,
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
        <Pressable {...props} style={[styles.base, { backgroundColor }]}>
            {icon}
            <Typography variant={variant} color={textColor as TypographyColor}>
                {title}
            </Typography>
        </Pressable>
    );
};

/**
 * Return the background and text color pair for a given button variant.
 *
 * Maps known ButtonType values to their corresponding backgroundColor and textColor.
 * When `type` is "custom", `opts.customBackgroundColor` and `opts.customColor` are used with sensible fallbacks
 * (transparent background, white text). Unrecognized types fall back to the "inactive" styling.
 *
 * @param type - The button variant to resolve.
 * @param opts - Optional custom colors; only used when `type` is "custom".
 * @returns An object with `backgroundColor` (CSS color string) and `textColor` (Typography color token or color string).
 */
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
    base: {
        flex: 1,
        height: 58,
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
});
