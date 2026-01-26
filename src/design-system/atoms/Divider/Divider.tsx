// Ghost Runner Design System - Divider

import { View } from "react-native";
import { useTheme } from "../../themes";

type DividerSize = "small" | "medium" | "large";

interface DividerProps {
    size?: DividerSize;
}

const sizeMap: Record<DividerSize, number> = {
    small: 1,
    medium: 4,
    large: 8,
};

export function Divider({ size = "small" }: DividerProps) {
    const theme = useTheme();

    return (
        <View
            style={[
                {
                    height: sizeMap[size],
                    backgroundColor: theme.divider,
                },
            ]}
        />
    );
}
