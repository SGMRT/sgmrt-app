// Ghost Runner Design System - Dark Theme

import { core, ghostLime, grey } from "../tokens/colors";
import type { SemanticColors } from "./types";

export const darkTheme: SemanticColors = {
    // UI Background & Surfaces
    uiBackground: grey[110],
    ui01: grey[100],
    ui02: grey[90],
    ui03: grey[80],
    ui04: grey[70],
    ui05: grey[60],
    ui06: grey[50],
    ui07: grey[40],
    ui08: grey[30],
    ui09: grey[20],
    ui10: grey[10],

    // UI Up (elevated surfaces)
    uiUp: grey[100],
    uiUp01: grey[90],
    uiUp02: grey[80],
    uiUp03: grey[70],

    // Primary (Ghost Lime)
    primary: core.primary,
    primaryB: ghostLime[90],
    primaryO: "rgba(226, 255, 0, 0.2)",

    // Secondary (Ghost Red)
    secondary: core.secondary,

    // Tertiary
    tertiary: grey[80],
    tertiaryP: grey[90],

    // Divider
    divider: "rgba(121, 124, 138, 0.16)",
};
