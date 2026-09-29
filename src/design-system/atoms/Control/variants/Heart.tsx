// Ghost Runner Design System - Heart Control

import { Pressable } from "react-native";
import { HeartIcon } from "../../../icons";
import { useTheme } from "../../../themes";
import { SIZE, type ControlVariantProps } from "../types";

export function Heart({ status, disabled, onPress }: ControlVariantProps) {
    const theme = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
        >
            <HeartIcon
                width={SIZE}
                height={SIZE}
                color={
                    disabled
                        ? theme.uiDisabledFg
                        : status
                          ? theme.primary
                          : theme.ui07
                }
            />
        </Pressable>
    );
}
