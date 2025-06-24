import colors from "@/src/theme/colors";
import { StyleSheet, Text, TextProps } from "react-native";

export type TypographyVariant =
    | "display1"
    | "display2"
    | "headline"
    | "subhead1"
    | "subhead2"
    | "subhead3"
    | "body1"
    | "body2"
    | "caption1";

export type TypographyColor =
    | "black"
    | "gray80"
    | "gray60"
    | "gray40"
    | "gray20"
    | "white"
    | "primary"
    | "red";

export function Typography({
    children,
    style,
    variant = "body1",
    color = "black",
    ...props
}: TextProps & { variant?: TypographyVariant; color?: TypographyColor }) {
    const variantStyle = typographyStyles[variant];
    const colorStyle = typographyStyles[color];
    return (
        <Text style={[variantStyle, colorStyle, style]} {...props}>
            {children}
        </Text>
    );
}

export const typographyStyles = StyleSheet.create({
    display1: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 28,
        lineHeight: 42,
        letterSpacing: -0.6,
    },
    display2: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 24,
        lineHeight: 36,
        letterSpacing: -0.6,
    },
    headline: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 20,
        lineHeight: 30,
        letterSpacing: -0.6,
    },
    subhead1: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 18,
        lineHeight: 27,
        letterSpacing: -0.6,
    },
    subhead2: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.6,
    },
    subhead3: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 14,
        lineHeight: 21,
        letterSpacing: -0.6,
    },
    body1: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.6,
    },
    body2: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 14,
        lineHeight: 21,
        letterSpacing: -0.6,
    },
    caption1: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12,
        lineHeight: 18,
        letterSpacing: -0.6,
    },
    black: {
        color: colors.black,
    },
    gray80: {
        color: colors.gray[80],
    },
    gray60: {
        color: colors.gray[60],
    },
    gray40: {
        color: colors.gray[40],
    },
    gray20: {
        color: colors.gray[20],
    },
    white: {
        color: colors.white,
    },
    primary: {
        color: colors.primary,
    },
    red: {
        color: "#FF3358",
    },
});
