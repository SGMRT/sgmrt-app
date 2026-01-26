// Ghost Runner Design System - Color Tokens

// Color Scale: 10 (lightest) ~ 110 (darkest)

// Grey
export const grey = {
    10: "#FAFAFA",
    20: "#E3E3E3",
    30: "#CCCCCC",
    40: "#B0B0B0",
    50: "#949494",
    60: "#808080",
    70: "#6B6B6B",
    80: "#4D4D4D",
    90: "#383838",
    100: "#212121",
    110: "#141414",
} as const;

// Ghost Lime
export const ghostLime = {
    10: "#FDFFF0",
    20: "#F7FFB8",
    30: "#F3FF99",
    40: "#ECFF5C",
    50: "#E2FF00", // Primary
    60: "#C7E000",
    70: "#ADC200",
    80: "#8D9E00",
    90: "#728000",
    100: "#4D5700",
    110: "#323800",
} as const;

// Ghost Red
export const ghostRed = {
    10: "#FFF5F7",
    20: "#FFE0E6",
    30: "#FFBDC9",
    40: "#FFA3B3",
    50: "#FF7A92",
    60: "#FF5271",
    70: "#FF3358", // Secondary
    80: "#DC183C",
    90: "#C31837",
    100: "#A11730",
    110: "#841025",
} as const;

// Core Colors (Direct Access)
export const core = {
    primary: ghostLime[50],
    secondary: ghostRed[70],
    black: "#000000",
    white: "#FFFFFF",
} as const;

// Shadows
export const shadows = {
    shadow01: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
} as const;

// Type exports
export type GreyScale = keyof typeof grey;
export type GhostLimeScale = keyof typeof ghostLime;
export type GhostRedScale = keyof typeof ghostRed;
export type ShadowScale = keyof typeof shadows;
