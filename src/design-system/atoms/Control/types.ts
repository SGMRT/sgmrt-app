// Ghost Runner Design System - Control Types

export type ControlType = "radio" | "toggle" | "checkFill" | "heart" | "check";

export interface ControlVariantProps {
    status: boolean;
    disabled: boolean;
    onPress: () => void;
}

export interface ControlProps {
    type: ControlType;
    status?: boolean;
    onChange?: (status: boolean) => void;
    disabled?: boolean;
}

export const SIZE = 24;
