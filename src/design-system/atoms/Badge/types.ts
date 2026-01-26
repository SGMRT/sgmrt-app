// Ghost Runner Design System - Badge Types

import type { SvgProps } from "react-native-svg";
import { typography } from "../../tokens";

export type BadgeSize = "small" | "large";
export type BadgeTheme = "uiB" | "ui02" | "primary";

export type BadgePropsNormal = {
    type: "normal";
    size: BadgeSize;
    theme: BadgeTheme;
    text: string;
    icon?: React.ComponentType<SvgProps>;
    /** 아이콘이 있을 때 오른쪽에 동일 사이즈의 투명 홀더를 추가하여 텍스트 중앙 정렬 */
    iconBalanced?: boolean;
};

export type BadgePropsCircular = {
    type: "circular";
    size: BadgeSize;
    theme: BadgeTheme;
};

export type BadgePropsCircularText = {
    type: "circularText";
    theme: BadgeTheme;
    text: string;
};

export type BadgeProps =
    | BadgePropsNormal
    | BadgePropsCircular
    | BadgePropsCircularText;

// Theme colors type
export interface BadgeColors {
    background: string;
    border: string;
    borderWidth: number;
    circle: string;
    text: string;
}

// Size configurations
export const CIRCULAR_DOT_SIZE = { small: 4, large: 6 } as const;
export const CIRCULAR_TEXT_SIZE = 20;

export const NORMAL_CONFIG = {
    small: {
        height: 26,
        paddingHorizontal: 6,
        borderRadius: 8,
        gap: 2,
        iconSize: 16,
        ...typography.variants.caption,
    },
    large: {
        height: 35,
        paddingHorizontal: 8,
        borderRadius: 10,
        gap: 4,
        iconSize: 20,
        ...typography.variants.body2,
    },
} as const;
