// Ghost Runner Design System - Check Control

import { Pressable } from "react-native";
import { CheckIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { SIZE, type ControlVariantProps } from "../types";

export function Check({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <CheckIcon
                width={SIZE}
                height={SIZE}
                color={status ? theme.primary : theme.ui10}
            />
        </Pressable>
    );
}
