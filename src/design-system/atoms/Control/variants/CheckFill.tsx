// Ghost Runner Design System - Checkbox Control

import { Pressable } from "react-native";
import { CheckIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { radius } from "../../../tokens";
import { SIZE, type ControlVariantProps } from "../types";

export function CheckFill({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
                width: SIZE,
                height: SIZE,
                borderRadius: radius.sm,
                backgroundColor: status ? theme.primary : theme.ui02,
                alignItems: "center",
                justifyContent: "center",
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <CheckIcon
                width={20}
                height={20}
                color={status ? theme.ui01 : theme.ui08}
            />
        </Pressable>
    );
}
