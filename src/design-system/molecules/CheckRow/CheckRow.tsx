// Ghost Runner Design System - CheckRow
//
// Control + 라벨 + (우측 요소) 로 이루어진 한 줄이다.
// Atom 을 조합한 것이라 atoms 가 아니라 molecules 에 둔다.
//
// 약관 동의, 설정 켜기, 목록 다중 선택은 전부 이 구조다.
// surface 를 켜면 카드가 되고, 끄면 평평한 줄이 된다.
// 묶음의 대표 항목(전체 동의 등)에만 카드를 주어 위계를 만든다.

import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Control } from "../../atoms/Control";
import type { ControlType } from "../../atoms/Control/types";
import { darkTheme } from "../../themes/dark";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

interface CheckRowProps {
    label: string;
    checked: boolean;
    onToggle: (next: boolean) => void;
    /** 어떤 모양의 제어를 쓸지. 기본은 체크 마크 */
    control?: ControlType;
    /** 카드 면을 깔지 여부. 묶음의 대표 항목에만 준다 */
    surface?: boolean;
    /** 오른쪽에 붙일 것. 상세 보기 화살표 등 */
    trailing?: ReactNode;
    /** 오른쪽 요소를 눌렀을 때 */
    onPressTrailing?: () => void;
    /** 라벨을 크게 쓸지. 대표 항목은 한 단계 키운다 */
    emphasis?: boolean;
    disabled?: boolean;
}

export function CheckRow({
    label,
    checked,
    onToggle,
    control = "check",
    surface = false,
    trailing,
    onPressTrailing,
    emphasis = false,
    disabled = false,
}: CheckRowProps) {
    return (
        <View style={[styles.row, surface ? styles.surface : styles.plain]}>
            {/* 제어와 라벨은 한 덩어리로 눌린다. 체크 아이콘만 겨냥할 필요가 없다 */}
            <Pressable
                style={[styles.main, surface ? styles.mainSurface : null]}
                onPress={() => !disabled && onToggle(!checked)}
                disabled={disabled}
            >
                <Control
                    type={control}
                    status={checked}
                    onChange={onToggle}
                    disabled={disabled}
                />
                <Text
                    style={[
                        styles.label,
                        emphasis ? styles.labelStrong : null,
                        // 고르지 않은 줄은 한 단계 낮춘다.
                        // 여러 줄이 늘어설 때 무엇을 골랐는지 색만으로 훑을 수 있다.
                        { color: checked ? darkTheme.ui10 : darkTheme.ui06 },
                    ]}
                    numberOfLines={2}
                >
                    {label}
                </Text>
            </Pressable>

            {trailing ? (
                <Pressable hitSlop={8} onPress={onPressTrailing}>
                    {trailing}
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    surface: {
        minHeight: 60,
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.xl,
        paddingHorizontal: spacing[20],
        paddingVertical: spacing[16],
    },
    plain: {
        paddingVertical: spacing[8],
    },
    main: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        // 평평한 줄은 조밀하게 둔다. 여러 줄이 이어질 때 간격이 벌어지면 묶음이 흩어져 보인다
        gap: spacing[8],
    },
    // 카드 안은 여백이 넉넉하므로 요소 사이도 그에 맞춘다
    mainSurface: {
        gap: spacing[12],
    },
    label: {
        flex: 1,
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 16,
        lineHeight: 24,
    },
    labelStrong: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 18,
        lineHeight: 27,
    },
});
