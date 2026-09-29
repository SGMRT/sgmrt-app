// Ghost Runner Design System - Dark Theme

import { core, ghostLime, grey, shadows } from "../tokens/colors";
import type { SemanticColors } from "./types";

export const darkTheme: SemanticColors = {
    // UI Background & Surfaces
    uiBackground: grey[110],
    ui01: grey[100],
    ui02: grey[90],
    ui03: grey[80],
    ui04: grey[70],
    ui05: grey[60],
    ui06: grey[50],
    ui07: grey[40],
    ui08: grey[30],
    ui09: grey[20],
    ui10: grey[10],

    // Primary (Ghost Lime)
    primary: core.primary,
    primaryB: ghostLime[90],
    primaryO: "rgba(226, 255, 0, 0.2)",

    // Secondary (Ghost Red)
    secondary: core.secondary,

    // Tertiary
    tertiary: grey[80],
    tertiaryP: grey[90],

    /**
     * 못 누르는 상태.
     *
     * 투명도로 흐리지 않고 색으로 나타낸다.
     * 면과 글자가 한꺼번에 흐려지면 "못 누른다" 가 아니라
     * "화면이 흐리다" 로 읽히기 때문이다.
     *
     * 위계에 따라 두 단계로 나뉜다.
     *
     *   uiDisabledUp  주 행동 버튼
     *   uiDisabled    토글·체크처럼 작은 조작, 그리고 보조 행동 버튼
     *
     * 주 행동 버튼은 면이 넓다. 같은 색이라도 면이 넓을수록 어둡게 읽혀서
     * 작은 조작과 같은 값을 쓰면 배경에 묻힌다.
     * 못 누른다는 것은 알리되 거기에 버튼이 있다는 사실까지 지우면 안 된다.
     * 글자도 함께 올린다. 면만 바꾸면 대비가 어긋나 무슨 버튼인지 읽히지 않는다.
     *
     * 다른 조작이 꺼져서 따라 꺼진 딸린 조작은 세 번째 단계를 두지 않는다.
     * 카드(ui01)와 배경의 차이가 3뿐이라 그 사이에 면 단계를 둘 자리가 없다.
     * 대신 제 면을 잃고 배경 높이로 내려앉게 한다.
     * 면을 가진 다른 비활성과 달리 면이 사라지는 것으로 딸려 있음이 읽힌다.
     */
    uiDisabled: grey[90],
    uiDisabledFg: grey[60],
    uiDisabledUp: grey[80],
    uiDisabledUpFg: grey[50],

    // Divider
    divider: "rgba(121, 124, 138, 0.16)",

    // Shadows
    shadow01: shadows.shadow01,
};
