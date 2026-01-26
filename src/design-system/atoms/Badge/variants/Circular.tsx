// Ghost Runner Design System - Circular Badge

import { View } from "react-native";
import type { BadgeColors, BadgePropsCircular } from "../types";
import { CIRCULAR_DOT_SIZE } from "../types";

interface CircularProps extends Omit<BadgePropsCircular, "type"> {
    colors: BadgeColors;
}

export function Circular({ size, colors }: CircularProps) {
    const dotSize = CIRCULAR_DOT_SIZE[size];

    return (
        <View
            style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: colors.circle,
            }}
        />
    );
}
