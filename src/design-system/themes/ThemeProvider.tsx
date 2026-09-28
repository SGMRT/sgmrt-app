// Ghost Runner Design System - Theme Provider
//
// 현재 다크 테마만 지원한다.
// 라이트 테마가 필요해지면 themes/light.ts 를 다시 만들고,
// types.ts 의 ColorScheme 에 "light" 를 되살린 뒤 여기서 분기하면 된다.

import React, { createContext } from "react";
import { darkTheme } from "./dark";
import type { SemanticColors, ThemeContextValue } from "./types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_CONTEXT: ThemeContextValue = {
    theme: darkTheme,
    colorScheme: "dark",
    isDark: true,
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    return (
        <ThemeContext.Provider value={DARK_CONTEXT}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext(): ThemeContextValue {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useThemeContext must be used within ThemeProvider");
    }
    return context;
}

export function useTheme(): SemanticColors {
    return useThemeContext().theme;
}
