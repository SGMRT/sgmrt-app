// Ghost Runner Design System - Tabs
//
// 한 화면 안에서 보여 줄 갈래를 고르는 줄이다.
// 화면 사이를 오가는 아래쪽 탭 바와는 다르다. 이것은 같은 화면 안의 갈래다.
//
// 고름을 밑줄로 나타낸다. 선택지 버튼은 면으로 나타내지만 탭은 다르다.
// 탭은 제목 바로 아래에 붙어 화면의 머리 노릇을 하므로, 면을 깔면
// 제목보다 무거워져 무엇이 화면 이름인지 흐려진다.
// 밑줄은 글자에 붙어 어느 갈래인지만 말하고 물러난다.
//
// 밑줄은 고른 글자와 같은 밝기(ui10)다.
// 표시가 제가 가리키는 글자보다 어두우면 무엇을 고른 것인지 두 번 봐야 한다.
//
// 줄 전체에 기준선을 깐다. 고른 칸에만 선이 있으면 화면 가운데서 선이
// 뚝 끊겨 덜 그려진 것처럼 보인다. 기준선은 구분선과 같은 값(uiUp)이다.
//
// 밑줄은 칸 사이를 미끄러진다. 툭 바뀌면 어디에서 어디로 옮겨 갔는지
// 눈이 따라가지 못해 화면이 통째로 갈린 것처럼 느껴진다.

import { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { darkTheme } from "../../themes/dark";
import { duration, easing } from "../../tokens/motion";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

/**
 * 한 칸의 높이.
 *
 * 글자(24)만으로는 손가락이 닿을 자리가 모자란다.
 * 위아래로 10 씩 둬서 44 를 만든다.
 */
const TAB_HEIGHT = 44;
/** 고름을 나타내는 밑줄의 굵기. 기준선(1)보다 두꺼워야 선 위에 얹힌 것으로 읽힌다. */
const INDICATOR_HEIGHT = 2;

export interface TabOption<K extends string> {
    key: K;
    title: string;
}

interface TabsProps<K extends string> {
    options: TabOption<K>[];
    selected: K;
    onSelect: (key: K) => void;
}

export function Tabs<K extends string>({
    options,
    selected,
    onSelect,
}: TabsProps<K>) {
    const [width, setWidth] = useState(0);
    const reduceMotion = useReducedMotion();

    const index = Math.max(
        0,
        options.findIndex((o) => o.key === selected),
    );
    const tabWidth = options.length > 0 ? width / options.length : 0;

    // 폭을 재기 전에는 0 이므로 밑줄을 그리지 않는다.
    // 재고 나서 처음 앉을 때는 미끄러지지 않아야 한다.
    // 화면이 열리자마자 밑줄이 왼쪽에서 달려오면 고르지도 않은 움직임이 생긴다.
    const measured = useSharedValue(false);
    const target = useDerivedValue(() => index * tabWidth, [index, tabWidth]);

    const indicatorStyle = useAnimatedStyle(() => {
        const x = target.value;
        if (!measured.value) {
            measured.value = true;
            return { width: tabWidth, transform: [{ translateX: x }] };
        }
        return {
            width: tabWidth,
            transform: [
                {
                    translateX: reduceMotion
                        ? x
                        : withTiming(x, {
                              duration: duration.normal,
                              easing: easing.out,
                          }),
                },
            ],
        };
    }, [tabWidth, reduceMotion]);

    const onLayout = (e: LayoutChangeEvent) =>
        setWidth(e.nativeEvent.layout.width);

    return (
        <View style={styles.container} onLayout={onLayout}>
            <View style={styles.row}>
                {options.map((option) => (
                    <Tab
                        key={option.key}
                        title={option.title}
                        selected={option.key === selected}
                        onPress={() => onSelect(option.key)}
                    />
                ))}
            </View>
            <View style={styles.baseline} />
            {width > 0 && (
                <Animated.View style={[styles.indicator, indicatorStyle]} />
            )}
        </View>
    );
}

function Tab({
    title,
    selected,
    onPress,
}: {
    title: string;
    selected: boolean;
    onPress: () => void;
}) {
    // 누름을 투명도로 나타내지 않는다.
    // 어두운 배경에서 투명도를 낮추면 글자가 배경으로 끌려가 오히려 어두워진다.
    // 고르지 않은 칸의 글자를 한 단계 올려 손이 닿은 자리를 밝힌다.
    const [pressed, setPressed] = useState(false);
    const reduceMotion = useReducedMotion();

    const color = selected
        ? darkTheme.ui10
        : pressed
          ? darkTheme.ui09
          : darkTheme.ui07;

    const animatedColor = useAnimatedStyle(
        () => ({
            color: reduceMotion
                ? color
                : withTiming(color, {
                      duration: duration.fast,
                      easing: easing.out,
                  }),
        }),
        [color, reduceMotion],
    );

    return (
        <Pressable
            style={styles.tab}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
        >
            <Animated.Text
                style={[
                    styles.label,
                    // 고른 쪽은 굵기도 함께 올린다.
                    // 색만으로 가른 표시는 화면이 밝은 곳에서 먼저 무너진다.
                    selected ? styles.labelSelected : null,
                    animatedColor,
                ]}
                numberOfLines={1}
            >
                {title}
            </Animated.Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        // 화면 제목과의 사이. 두 화면이 12 와 8 로 서로 달랐다.
        marginTop: spacing[8],
    },
    row: {
        flexDirection: "row",
    },
    tab: {
        flex: 1,
        height: TAB_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 16,
        lineHeight: 24,
        // 세로 가운데 정렬이 어긋나지 않게 줄높이를 글자에 묶는다
        includeFontPadding: false,
    },
    labelSelected: {
        fontFamily: "SpoqaHanSansNeo-Bold",
    },
    baseline: {
        height: 1,
        width: "100%",
        backgroundColor: darkTheme.uiUp,
        borderRadius: radius.xs,
    },
    indicator: {
        position: "absolute",
        bottom: 0,
        left: 0,
        height: INDICATOR_HEIGHT,
        backgroundColor: darkTheme.ui10,
        borderRadius: radius.xs,
    },
});
