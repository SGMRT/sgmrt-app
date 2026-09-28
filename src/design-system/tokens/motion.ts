// Ghost Runner Design System - Motion Tokens
//
// 움직임도 색이나 간격과 같다. 값을 컴포넌트마다 적으면 금세 갈라진다.
// 여기서만 정하고 각 컴포넌트는 이름으로 가져다 쓴다.
//
// 값을 고른 기준
//   - 화면에서 자주 일어나는 일일수록 짧게 잡는다. 200ms 를 넘기지 않는다.
//   - 누름은 손끝 반응이라 가장 짧고, 상태 전환은 그보다 넉넉하다.
//   - 스프링은 눌렀다 뗄 때 살짝 지나쳤다 돌아오게 둔다. 그 되돌아옴이 촉감을 만든다.

import { Easing } from "react-native-reanimated";

/**
 * 이징.
 * 기본 곡선들은 화면에서 너무 약해 움직임이 밋밋하다.
 * 나가고 들어오는 것은 ease-out 을 쓴다. 시작이 빠르고 끝이 느려야
 * 같은 시간이라도 더 빠르게 느껴진다.
 */
export const easing = {
    out: Easing.bezier(0.23, 1, 0.32, 1),
} as const;

/** 밀리초 단위 지속 시간 */
export const duration = {
    /** 누르는 순간. 손이 닿자마자 반응해야 한다 */
    press: 90,
    /** 색이 바뀌는 정도의 짧은 전환 */
    fast: 120,
    /** 일반적인 상태 전환 */
    normal: 200,
} as const;

/**
 * 스프링 설정.
 * damping 이 낮을수록 더 튀고, stiffness 가 높을수록 빨리 도달한다.
 */
export const spring = {
    /** 눌렀다 뗄 때. 되돌아오며 살짝 지나친다 */
    press: { damping: 9, stiffness: 260, mass: 0.6 },
    /** 켜짐과 꺼짐 사이. 누름보다 부드럽게 앉는다 */
    toggle: { damping: 14, stiffness: 200, mass: 0.7 },
} as const;

/**
 * 누를 때 줄어드는 정도.
 * 면적이 큰 요소일수록 덜 줄여야 같은 세기로 느껴진다.
 * 버튼처럼 넓은 것을 0.88 로 줄이면 과장돼 보이고,
 * 체크처럼 작은 것을 0.96 으로 줄이면 움직인 줄 모른다.
 */
export const pressScale = {
    /** 버튼처럼 넓은 면 */
    wide: 0.96,
    /** 체크나 아이콘처럼 작은 것 */
    compact: 0.88,
} as const;
