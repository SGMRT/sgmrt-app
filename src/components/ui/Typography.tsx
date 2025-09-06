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
    | "body3"
    | "caption1"
    | "share_subhead"
    | "share_headline"
    | "share_stat"
    | "share_stat_unit"
    | "share_stat_description"
    | "mini"
    | "advertiser";

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
        fontFamily: "SpoqaHanSansNeo-Medium",
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
        fontSize: 18,
        lineHeight: 27,
        letterSpacing: -0.6,
    },
    body2: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.6,
    },
    body3: {
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

    share_subhead: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 14.7,
        letterSpacing: -0.49,
        lineHeight: 22.05,
    },
    share_headline: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 51.41,
        letterSpacing: -1.1,
        lineHeight: 77.15,
    },
    share_stat: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 21.58,
        lineHeight: 32.37,
        letterSpacing: -0.46,
    },
    share_stat_unit: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 18.5,
        lineHeight: 27.75,
        letterSpacing: -0.46,
    },
    share_stat_description: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12.33,
        lineHeight: 18.495,
        letterSpacing: -0.46,
    },
    mini: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 8,
        lineHeight: 12,
        letterSpacing: -0.6,
    },
    advertiser: {
        fontFamily: "SpoqaHanSansNeo-Bold",
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
        color: colors.red,
    },
});
