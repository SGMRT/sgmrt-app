// Ghost Runner Design System - Typography Tokens

// Font Family
export const fontFamily = {
    regular: "SpoqaHanSansNeo-Regular",
    medium: "SpoqaHanSansNeo-Medium",
} as const;

// Font Size Scale
export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    base: 18,
    lg: 20,
    xl: 24,
    "2xl": 28,
} as const;

// Line Height Scale (150%)
export const lineHeight = {
    xs: 18,
    sm: 21,
    md: 24,
    base: 27,
    lg: 30,
    xl: 36,
    "2xl": 42,
} as const;

// Font Weight
export const fontWeight = {
    regular: "400",
    medium: "500",
} as const;

// Typography Variants (Figma Foundation 기반)
export const typographyVariants = {
    display1: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize["2xl"],
        lineHeight: lineHeight["2xl"],
        fontWeight: fontWeight.medium,
        letterSpacing: -0.6,
    },
    display2: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xl,
        lineHeight: lineHeight.xl,
        fontWeight: fontWeight.regular,
        letterSpacing: -0.6,
    },
    headline: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.lg,
        lineHeight: lineHeight.lg,
        fontWeight: fontWeight.medium,
        letterSpacing: -0.6,
    },
    subhead1: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.medium,
        letterSpacing: -0.6,
    },
    subhead2: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        lineHeight: lineHeight.md,
        fontWeight: fontWeight.medium,
        letterSpacing: -0.6,
    },
    body1: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.regular,
        letterSpacing: -0.6,
    },
    body2: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        lineHeight: lineHeight.md,
        fontWeight: fontWeight.regular,
        letterSpacing: -0.6,
    },
    body3: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.regular,
        letterSpacing: -0.6,
    },
    caption: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        lineHeight: lineHeight.xs,
        fontWeight: fontWeight.regular,
        letterSpacing: -0.6,
    },
} as const;

// Type exports
export type FontSize = keyof typeof fontSize;
export type LineHeight = keyof typeof lineHeight;
export type FontWeight = keyof typeof fontWeight;
export type TypographyVariant = keyof typeof typographyVariants;

// Grouped export for convenience
export const typography = {
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    variants: typographyVariants,
} as const;
