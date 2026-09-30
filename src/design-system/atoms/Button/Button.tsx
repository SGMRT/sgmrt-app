// Ghost Runner Design System - Button
//
// 피그마 "Atom > 버튼" 정의를 옮긴 컴포넌트다.
//
// Size    : small(24) / medium(40) / large(56)
// Theme   : ui01 / ui01P / ui02 / ui02P / ui03 / primary / primaryO / secondary
// Variant : filled(면) / line(외곽선)
//
// 면을 채운 버튼이 한 화면에 여러 개 있으면 무엇이 주된 행동인지 흐려진다.
// 주 행동만 면을 채우고, 보조 행동은 line 으로 낮춘다.
// 고른 상태(selected)는 면 밝기가 아니라 테두리로 나타낸다.
// 밝기는 위계를 뜻하고 테두리는 상태를 뜻하도록 역할을 갈라 두는 것이다.
//
// 고름 표시에 Primary 를 쓰지 않는다. Primary 는 주된 행동 몫이라,
// 보조 영역에서 같이 쓰면 화면에 강조가 둘이 되어 서로 힘을 깎는다.
// 대신 밝은 회색 테두리를 쓰고, 고르지 않은 쪽은 글자를 한 단계 낮춰 대비를 만든다.
//
// 크기와 폭은 버튼이 무엇에 매달린 행동인지로 정한다.
//   large(56)  화면의 주된 행동, 또는 입력과 같은 위계의 선택지 — 폭을 채운다
//   medium(40) 특정 요소에 딸린 보조 행동 — 내용 크기만 차지한다
//   small(24)  목록이나 카드 안의 작은 조작
// 예를 들어 프로필 사진 등록은 아바타에 딸린 행동이라 medium 이고,
// 주 행동이 아니라 폭을 채우지 않으며, 보조라서 line 이다. 셋 다 같은 이유에서 나온다.
//
// 누를 때 0.96 으로 줄어든다. 버튼은 자주 눌리는 요소라 120ms 로 짧게 잡았고,
// 크기 변화만으로는 상태를 알 수 없으므로 색도 함께 바뀐다.

import { ReactNode, useEffect } from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { darkTheme } from "../../themes/dark";
import { brand } from "../../tokens/colors";
import { duration, easing, pressScale } from "../../tokens/motion";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonSize = "small" | "medium" | "select" | "large";
export type ButtonTheme =
    | "ui01"
    | "ui01P"
    | "ui02"
    | "ui02P"
    | "ui03"
    | "primary"
    | "primaryO"
    | "secondary"
    | "kakao";

/**
 * 크기별 치수. 높이와 모서리는 피그마 실측값이다.
 * 간격과 모서리는 4px 단위 규칙을 따르므로 계산하지 않고 토큰에서 직접 고른다.
 */
const SIZE: Record<
    ButtonSize,
    {
        height: number;
        radius: number;
        fontSize: number;
        gap: number;
        paddingHorizontal: number;
    }
> = {
    small: {
        height: 24,
        radius: radius.md,
        fontSize: 12,
        gap: spacing[4],
        paddingHorizontal: spacing[8],
    },
    medium: {
        height: 40,
        radius: radius.base,
        fontSize: 14,
        gap: spacing[6],
        paddingHorizontal: spacing[16],
    },
    // 둘 중 하나를 고르는 선택지.
    // 주 행동과 같은 56 으로 두면 화면에서 무엇이 주된 행동인지 흐려진다.
    // 입력(56)보다 한 단계 낮되 딸린 보조 행동(40)보다는 높아야
    // 폼 안에서 고를 것과 딸린 것이 갈린다.
    select: {
        height: 48,
        radius: radius.base,
        fontSize: 16,
        gap: spacing[8],
        paddingHorizontal: spacing[20],
    },
    large: {
        height: 56,
        radius: radius.base,
        fontSize: 16,
        gap: spacing[8],
        paddingHorizontal: spacing[24],
    },
};

/**
 * 테마별 배경과 글자색.
 *
 * onLight 는 밝은 면 위에 어두운 글자가 오는 조합이다.
 * 이 경우 같은 굵기라도 글자가 가늘어 보인다. 배경 빛이 획을 파고들기 때문이고,
 * 어두운 면 위 밝은 글자가 두꺼워 보이는 것과 짝을 이루는 현상이다.
 * 눈에 같은 무게로 보이도록 굵기를 한 단계 올린다.
 */
// 누른 카카오 면. 밝은 면은 primary 와 같이 한 단계 밝아진다.
// ghostLime 50 -> 40 이 벌어진 만큼을 그대로 옮겼다.
const KAKAO_PRESSED = "#FFF05C";

const THEME: Record<
    ButtonTheme,
    { bg: string; pressedBg: string; fg: string; onLight?: boolean }
> = {
    ui01: {
        bg: darkTheme.ui01,
        pressedBg: darkTheme.ui01Pressed,
        fg: darkTheme.ui10,
    },
    ui01P: {
        bg: darkTheme.ui01,
        pressedBg: darkTheme.ui01Pressed,
        fg: darkTheme.primary,
    },
    ui02: {
        bg: darkTheme.ui02,
        pressedBg: darkTheme.ui02Pressed,
        fg: darkTheme.ui10,
    },
    // 선택된 상태. 배경이 한 단계 올라가서 고르지 않은 것과 면으로 구분된다
    ui02P: {
        bg: darkTheme.ui02,
        pressedBg: darkTheme.ui02Pressed,
        fg: darkTheme.primary,
    },
    ui03: {
        bg: darkTheme.ui03,
        pressedBg: darkTheme.ui03Pressed,
        fg: darkTheme.ui10,
    },
    primary: {
        bg: darkTheme.primary,
        pressedBg: darkTheme.primaryPressed,
        fg: darkTheme.uiBackground,
        onLight: true,
    },
    primaryO: {
        bg: darkTheme.primaryB,
        pressedBg: darkTheme.primaryBPressed,
        fg: darkTheme.primary,
    },
    secondary: {
        bg: darkTheme.secondary,
        pressedBg: darkTheme.secondaryPressed,
        fg: darkTheme.ui10,
    },
    // 카카오 로그인 버튼 하나만 쓴다. 색은 카카오가 정해 둔 값이라 바꿀 수 없다.
    // 다른 자리에 이 테마를 쓰면 사다리 밖 색이 화면에 늘어난다.
    kakao: {
        bg: brand.kakao.bg,
        pressedBg: KAKAO_PRESSED,
        fg: brand.kakao.fg,
        onLight: true,
    },
};

export type ButtonVariant = "filled" | "line";

interface ButtonProps {
    title: string;
    onPress?: () => void;
    size?: ButtonSize;
    theme?: ButtonTheme;
    variant?: ButtonVariant;
    /**
     * 고른 상태. 테두리로 표시한다.
     * 값을 주면 이 버튼이 선택지 묶음의 하나로 취급되어,
     * 고르지 않았을 때 글자가 한 단계 어두워진다.
     */
    selected?: boolean;
    /** 글자 왼쪽 아이콘 */
    leading?: ReactNode;
    /** 글자 오른쪽 아이콘 */
    trailing?: ReactNode;
    /**
     * 누름을 막는다. 색은 바꾸지 않는다.
     * 투명도를 낮추면 면과 글자가 한꺼번에 흐려져
     * "못 누른다"가 아니라 "화면이 흐리다"로 읽힌다.
     * 못 누르는 상태는 부르는 쪽에서 theme 으로 나타낸다.
     */
    disabled?: boolean;
    /** 가로를 꽉 채운다 */
    block?: boolean;
    /** 누를 때 줄어드는 효과를 끈다 */
    static?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

// 선택지 묶음의 고름은 면 밝기로 나타낸다.
//
// 테두리로 나타내면 고른 쪽만 윤곽이 생겨, 크기가 같은데도 커 보인다.
// 양쪽에 테두리를 둘러 맞출 수는 있지만 이번에는 화면에 라인 버튼이 늘어난다.
// 면으로 두면 입력과 같은 언어가 되고 크기도 그대로 읽힌다.
const SELECTED_BG = darkTheme.ui10;
const SELECTED_FG = darkTheme.uiBackground;
// 밝은 면 위 어두운 글자는 한 단계 굵게 해야 같은 굵기로 읽힌다
const SELECTED_ON_LIGHT = true;
// 테두리를 가진 버튼은 같은 높이의 채워진 면보다 커 보인다.
// 밝은 선이 실루엣 맨 바깥 픽셀에 얹히면 바깥으로 번져 보이는데,
// 면만 있는 입력은 배경과 차이가 3뿐이라 윤곽이 서지 않아 견줄 선이 없다.
// 좌우 1px 씩 줄여 선이 더하는 무게를 상쇄한다.
const OUTLINE_TRIM = 2;

export function Button({
    title,
    onPress,
    size = "large",
    theme = "ui01",
    variant = "filled",
    selected,
    leading,
    trailing,
    disabled = false,
    block = false,
    static: noScale = false,
    style,
    textStyle,
}: ButtonProps) {
    const s = SIZE[size];
    const t = THEME[theme];

    // line 은 면을 비우고 테두리만 남긴다.
    // selected 는 어느 변형에서든 테두리를 Primary 로 덮어써 상태를 드러낸다.
    const line = variant === "line";
    // selected 를 넘겼다면 선택지 묶음의 하나다
    const inGroup = selected !== undefined;

    // 못 누르는 상태는 테마를 덮어쓴다.
    // 예전에는 부르는 쪽이 어두운 theme 을 골라 나타냈는데,
    // 화면마다 고르는 값이 달라 같은 비활성이 서로 다르게 보였다.
    //
    // 색은 위계에 따라 갈린다. large 는 주 행동이거나 입력과 같은 위계의
    // 선택지라 면이 넓다. 넓은 면은 같은 색이라도 더 어둡게 읽혀서,
    // 작은 조작과 같은 값을 쓰면 화면 아래에서 배경에 묻힌다.
    // 못 누른다는 것은 알리되 거기에 버튼이 있다는 사실까지 지우면 안 된다.
    const mainAction = size === "large";
    const disabledBg = mainAction
        ? darkTheme.uiDisabledUp
        : darkTheme.uiDisabled;
    const disabledFg = mainAction
        ? darkTheme.uiDisabledUpFg
        : darkTheme.uiDisabledFg;

    // 선택지 묶음에서는 고르지 않은 쪽도 테두리 자리를 잡아 둔다.
    // 고른 쪽만 테두리가 생기면 두 버튼의 내용 상자가 2px 달라진다.
    // 자리를 투명으로 비워 두면 배경이 비쳐 면이 그만큼 작아 보이므로
    // 제 면과 같은 색으로 칠해 보이지 않게 둔다.
    const borderColor = disabled
        ? line
            ? disabledBg
            : undefined
        : line
          ? darkTheme.ui02
          : undefined;

    // 고르지 않은 쪽 글자를 비활성(ui05)과 같은 값으로 두면
    // 면까지 같은 #383838 이라 두 상태가 완전히 겹쳐 못 누르는 것처럼 보인다.
    // 한 단계 올려 "누를 수 있지만 지금 안 골랐다" 로 읽히게 한다.
    const textColor = disabled
        ? disabledFg
        : inGroup
          ? selected
              ? SELECTED_FG
              : darkTheme.ui07
          : line
            ? darkTheme.ui10
            : t.fg;

    const backgroundColor = line
        ? "transparent"
        : disabled
          ? disabledBg
          : selected
            ? SELECTED_BG
            : t.bg;

    // 누르는 동안의 면.
    //
    // 크기가 줄어드는 것만으로는 손가락에 가린 자리에서 보이지 않고,
    // 선택지처럼 여러 칸이 붙어 있으면 어느 칸을 눌렀는지도 알 수 없다.
    // 면이 한 단계 움직이면 그 자리가 눈에 남는다.
    //
    // line 은 면이 비어 있으므로 누를 때만 1뎁스가 들어온다.
    // 고른 쪽은 흰 면이라 위로 올라갈 자리가 없어 한 단계 내려온다.
    const pressedBackgroundColor = line
        ? darkTheme.ui01
        : selected
          ? darkTheme.ui10Pressed
          : t.pressedBg;

    const reduceMotion = useReducedMotion();

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // 조건을 채워 버튼이 살아나는 순간은 폼에서 가장 중요한 신호다.
    // 색이 툭 바뀌면 그 순간을 놓치기 쉬워 전환으로 잇는다.
    // 움직임이 아니라 색이라 모션을 줄인 기기에서도 남기되 더 짧게 끝낸다.
    const bg = useSharedValue(backgroundColor);
    const fg = useSharedValue(textColor);
    const bd = useSharedValue(borderColor ?? "transparent");

    useEffect(() => {
        const ms = reduceMotion ? duration.fast : duration.normal;
        bg.value = withTiming(backgroundColor, {
            duration: ms,
            easing: easing.out,
        });
        fg.value = withTiming(textColor, { duration: ms, easing: easing.out });
        bd.value = withTiming(borderColor ?? "transparent", {
            duration: ms,
            easing: easing.out,
        });
    }, [backgroundColor, textColor, borderColor, reduceMotion, bg, fg, bd]);

    const surfaceStyle = useAnimatedStyle(() => ({
        backgroundColor: bg.value,
        borderColor: bd.value,
    }));
    const labelColorStyle = useAnimatedStyle(() => ({ color: fg.value }));

    const press = (to: number, down: boolean) => {
        if (disabled) return;
        if (!noScale) scale.value = withTiming(to, { duration: duration.fast });
        // 색은 누름을 끈 버튼에서도 바뀐다.
        // 눌렸다는 사실은 크기가 아니라 상태로 알려야 한다.
        bg.value = withTiming(down ? pressedBackgroundColor : backgroundColor, {
            duration: duration.press,
            easing: easing.out,
        });
    };

    return (
        // 바깥에서 준 style 은 레이아웃(flex, margin 등)을 담으므로
        // Pressable 이 아니라 이 컨테이너에 얹어야 폭이 제대로 늘어난다
        <Animated.View
            style={[block ? styles.block : null, style, animatedStyle]}
        >
            <AnimatedPressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => press(pressScale.wide, true)}
                onPressOut={() => press(1, false)}
                disabled={disabled}
                style={[
                    styles.base,
                    {
                        height: s.height - (borderColor ? OUTLINE_TRIM : 0),
                        borderRadius: s.radius,
                        paddingHorizontal: s.paddingHorizontal,
                        gap: s.gap,
                        borderWidth: borderColor ? 1 : 0,
                    },
                    surfaceStyle,
                ]}
            >
                {leading}
                <Animated.Text
                    style={[
                        styles.label,
                        {
                            fontSize: s.fontSize,
                            fontFamily:
                                t.onLight ||
                                (selected && SELECTED_ON_LIGHT)
                                    ? "SpoqaHanSansNeo-Bold"
                                    : "SpoqaHanSansNeo-Medium",
                        },
                        labelColorStyle,
                        textStyle,
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Animated.Text>
                {trailing}
            </AnimatedPressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    block: {
        alignSelf: "stretch",
    },
    base: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        // 세로 가운데 정렬이 어긋나지 않도록 줄높이를 글자 크기에 묶는다
        includeFontPadding: false,
    },
});
