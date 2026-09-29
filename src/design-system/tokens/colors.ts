// Ghost Runner Design System - Color Tokens

// Color Scale: 10 (lightest) ~ 110 (darkest)

// Grey
export const grey = {
    10: "#FAFAFA",
    20: "#E3E3E3",
    30: "#CCCCCC",
    40: "#B0B0B0",
    50: "#949494",
    60: "#808080",
    70: "#6B6B6B",
    80: "#4D4D4D",
    90: "#383838",
    /**
     * 카드 위에 얹히는 면.
     *
     * 90 과 100 사이가 22 나 벌어져 있어, 카드 안에 다시 카드가 놓이는 자리를
     * 담을 값이 없었다. 90 을 쓰면 안쪽이 지나치게 튀고
     * 100 을 쓰면 바깥 카드와 붙어 층이 사라진다.
     *
     * 이 값을 넣으면 배경 20, 카드 26, 그 위 34 로 사다리가 고르게 놓인다.
     * 앱이 원래 쓰던 값이기도 하다.
     *
     * 피그마 Foundation 에도 더해야 한다.
     */
    95: "#222222",
    // 카드 면. 배경에서 살짝 떠오른다.
    //
    // 예전에는 #212121 이었는데 카드로 쓰기에 너무 밝았다.
    // 배경과 13 벌어져 카드가 화면에서 먼저 눈에 들어왔다.
    // 앱이 쓰던 #171717 은 3뿐이라 카드가 있는지도 잘 보이지 않았다.
    // 6 으로 두어 면이 있다는 것은 읽히되 내용보다 앞서지 않게 한다.
    //
    // 피그마 Foundation 에도 반영해야 한다.
    100: "#1A1A1A",
    110: "#141414",
} as const;

// Ghost Lime
export const ghostLime = {
    10: "#FDFFF0",
    20: "#F7FFB8",
    30: "#F3FF99",
    40: "#ECFF5C",
    50: "#E2FF00", // Primary
    60: "#C7E000",
    70: "#ADC200",
    80: "#8D9E00",
    90: "#728000",
    100: "#4D5700",
    110: "#323800",
} as const;

// Ghost Red
export const ghostRed = {
    10: "#FFF5F7",
    20: "#FFE0E6",
    30: "#FFBDC9",
    40: "#FFA3B3",
    50: "#FF7A92",
    60: "#FF5271",
    70: "#FF3358", // Secondary
    80: "#DC183C",
    90: "#C31837",
    100: "#A11730",
    110: "#841025",
} as const;

// Core Colors (Direct Access)
export const core = {
    primary: ghostLime[50],
    secondary: ghostRed[70],
    black: "#000000",
    white: "#FFFFFF",
} as const;

// Shadows
export const shadows = {
    shadow01: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
} as const;

// Type exports
export type GreyScale = keyof typeof grey;
export type GhostLimeScale = keyof typeof ghostLime;
export type GhostRedScale = keyof typeof ghostRed;
export type ShadowScale = keyof typeof shadows;
