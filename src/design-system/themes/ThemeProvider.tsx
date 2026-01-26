// Ghost Runner Design System - Theme Provider

import React, { createContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";
import type { ColorScheme, SemanticColors, ThemeContextValue } from "./types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    children: React.ReactNode;
    forcedColorScheme?: ColorScheme;
}

export function ThemeProvider({
    children,
    forcedColorScheme,
}: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const colorScheme: ColorScheme =
        forcedColorScheme ?? systemColorScheme ?? "dark";

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme: colorScheme === "dark" ? darkTheme : lightTheme,
            colorScheme,
            isDark: colorScheme === "dark",
        }),
        [colorScheme]
    );

    return (
        <ThemeContext.Provider value={value}>
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
