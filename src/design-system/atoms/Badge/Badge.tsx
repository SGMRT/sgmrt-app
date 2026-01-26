// Ghost Runner Design System - Badge

import { useTheme } from "../../themes";
import type { BadgeColors, BadgeProps } from "./types";
import { Circular, CircularText, Normal } from "./variants";

export function Badge(props: BadgeProps) {
    const theme = useTheme();
    const { type, theme: badgeTheme } = props;

    // Theme-based colors
    const colors: BadgeColors = {
        uiB: {
            background: theme.uiBackground,
            border: theme.ui03,
            borderWidth: 1,
            circle: theme.ui08,
            text: theme.ui08,
        },
        ui02: {
            background: theme.ui02,
            border: theme.ui02,
            borderWidth: 1,
            circle: theme.ui02,
            text: theme.ui10,
        },
        primary: {
            background: theme.primaryO,
            border: "transparent",
            borderWidth: 0,
            circle: theme.primary,
            text: theme.primary,
        },
    }[badgeTheme];

    if (type === "circular") {
        return (
            <Circular size={props.size} theme={badgeTheme} colors={colors} />
        );
    }

    if (type === "circularText") {
        return (
            <CircularText
                text={props.text}
                theme={badgeTheme}
                colors={colors}
            />
        );
    }

    return (
        <Normal
            size={props.size}
            theme={badgeTheme}
            text={props.text}
            icon={props.icon}
            iconBalanced={props.iconBalanced}
            colors={colors}
        />
    );
}
