// Ghost Runner Design System - Radio Control

import { Pressable } from "react-native";
import { CheckIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { SIZE, type ControlVariantProps } from "../types";

export function Radio({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                backgroundColor: status ? theme.primary : theme.ui07,
                alignItems: "center",
                justifyContent: "center",
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <CheckIcon
                width={20}
                height={20}
                color={status ? theme.ui01 : theme.ui10}
            />
        </Pressable>
    );
}
