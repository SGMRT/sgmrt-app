// Ghost Runner Design System - Control

import type { ControlProps } from "./types";
import { Check } from "./variants/Check";
import { CheckFill } from "./variants/CheckFill";
import { Heart } from "./variants/Heart";
import { Radio } from "./variants/Radio";
import { Toggle } from "./variants/Toggle";

const variantMap = {
    heart: Heart,
    toggle: Toggle,
    check: Check,
    checkFill: CheckFill,
    radio: Radio,
} as const;

export function Control({
    type,
    status = false,
    onChange,
    disabled = false,
}: ControlProps) {
    const handlePress = () => {
        if (!disabled) {
            onChange?.(!status);
        }
    };

    const Variant = variantMap[type];

    return (
        <Variant status={status} disabled={disabled} onPress={handlePress} />
    );
}
