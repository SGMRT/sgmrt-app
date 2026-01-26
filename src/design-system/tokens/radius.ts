// Ghost Runner Design System - Sizing Tokens

// Border Radius
export const radius = {
    xs: 4,
    sm: 6,
    md: 8,
    base: 12,
    lg: 14,
    xl: 16,
    "2xl": 20,
    "3xl": 24,
    full: 9999,
} as const;

// Type exports
export type Radius = keyof typeof radius;
