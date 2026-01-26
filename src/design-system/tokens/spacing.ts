// Ghost Runner Design System - Spacing Tokens

// 4px 기반 스케일
export const spacing = {
    2: 2,
    4: 4,
    6: 6,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    36: 36,
    40: 40,
    48: 48,
    64: 64,
    72: 72,
    80: 80,
} as const;

// Type exports
export type Spacing = keyof typeof spacing;
