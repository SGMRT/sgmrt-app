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

    // 카드 위에 얹히는 면
    uiUp: string;

    // Primary (Ghost Lime)
    primary: string;
    primaryB: string;
    primaryO: string;

    // Secondary (Ghost Red)
    secondary: string;

    // Tertiary
    tertiary: string;
    tertiaryP: string;

    // Disabled (못 누르는 상태). 위계에 따라 두 단계로 나뉜다
    uiDisabled: string;
    uiDisabledFg: string;
    uiDisabledUp: string;
    uiDisabledUpFg: string;

    // Divider
    divider: string;

    // Shadows
    shadow01: string;
}

// 현재 다크만 지원한다. 라이트를 추가하면 "light" 를 되살린다.
export type ColorScheme = "dark";

export interface ThemeContextValue {
    theme: SemanticColors;
    colorScheme: ColorScheme;
    isDark: boolean;
}
