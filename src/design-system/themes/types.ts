// Ghost Runner Design System - Theme Types

export interface SemanticColors {
    // UI Background & Surfaces
    uiBackground: string;
    ui01: string;
    ui02: string;
    ui03: string;
    ui04: string;
    ui05: string;
    ui06: string;
    ui07: string;
    ui08: string;
    ui09: string;
    ui10: string;

    // UI Up (elevated surfaces)
    uiUp: string;
    uiUp01: string;
    uiUp02: string;
    uiUp03: string;

    // Primary (Ghost Lime)
    primary: string;
    primaryB: string;
    primaryO: string;

    // Secondary (Ghost Red)
    secondary: string;

    // Tertiary
    tertiary: string;
    tertiaryP: string;

    // Divider
    divider: string;
}

export type ColorScheme = "light" | "dark";

export interface ThemeContextValue {
    theme: SemanticColors;
    colorScheme: ColorScheme;
    isDark: boolean;
}
