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

import { ReactNode } from "react";
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
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { darkTheme } from "../../themes/dark";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

export type ButtonSize = "small" | "medium" | "large";
export type ButtonTheme =
    | "ui01"
    | "ui01P"
    | "ui02"
    | "ui02P"
    | "ui03"
    | "primary"
    | "primaryO"
    | "secondary";

/** 크기별 치수. 높이와 모서리는 피그마 실측값이다. */
const SIZE: Record<
    ButtonSize,
    { height: number; radius: number; fontSize: number; gap: number }
> = {
    small: { height: 24, radius: radius.md, fontSize: 12, gap: spacing[4] },
    medium: { height: 40, radius: radius.base, fontSize: 14, gap: spacing[6] },
    large: { height: 56, radius: radius.xl, fontSize: 16, gap: spacing[8] },
};

/** 테마별 배경과 글자색 */
const THEME: Record<ButtonTheme, { bg: string; fg: string }> = {
    ui01: { bg: darkTheme.ui01, fg: darkTheme.ui10 },
    ui01P: { bg: darkTheme.ui01, fg: darkTheme.primary },
    ui02: { bg: darkTheme.ui02, fg: darkTheme.ui10 },
    // 선택된 상태. 배경이 한 단계 올라가서 고르지 않은 것과 면으로 구분된다
    ui02P: { bg: darkTheme.ui02, fg: darkTheme.primary },
    ui03: { bg: darkTheme.ui03, fg: darkTheme.ui10 },
    primary: { bg: darkTheme.primary, fg: darkTheme.uiBackground },
    primaryO: { bg: darkTheme.primaryB, fg: darkTheme.primary },
    secondary: { bg: darkTheme.secondary, fg: darkTheme.ui10 },
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
    disabled?: boolean;
    /** 가로를 꽉 채운다 */
    block?: boolean;
    /** 누를 때 줄어드는 효과를 끈다 */
    static?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

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

    const borderColor = selected
        ? darkTheme.ui07
        : line
          ? darkTheme.ui03
          : undefined;

    const textColor = inGroup
        ? selected
            ? darkTheme.ui10
            : darkTheme.ui05
        : line
          ? darkTheme.ui10
          : t.fg;

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const press = (to: number) => {
        if (noScale || disabled) return;
        scale.value = withTiming(to, { duration: 120 });
    };

    return (
        // 바깥에서 준 style 은 레이아웃(flex, margin 등)을 담으므로
        // Pressable 이 아니라 이 컨테이너에 얹어야 폭이 제대로 늘어난다
        <Animated.View
            style={[block ? styles.block : null, style, animatedStyle]}
        >
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={() => press(0.96)}
                onPressOut={() => press(1)}
                disabled={disabled}
                style={[
                    styles.base,
                    {
                        height: s.height,
                        borderRadius: s.radius,
                        paddingHorizontal: s.height / 2 - 4,
                        gap: s.gap,
                        backgroundColor: line ? "transparent" : t.bg,
                        borderWidth: borderColor ? 1 : 0,
                        borderColor,
                        opacity: disabled ? 0.4 : 1,
                    },
                ]}
            >
                {leading}
                <Text
                    style={[
                        styles.label,
                        { fontSize: s.fontSize, color: textColor },
                        textStyle,
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                {trailing}
            </Pressable>
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
