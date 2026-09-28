// Ghost Runner Design System - PageIndicator

import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../themes";
import { duration, easing } from "../../tokens/motion";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

/** 바 하나의 두께 */
const BAR_HEIGHT = 4;

/** 지금 보고 있지 않은 페이지의 바 길이 */
const BAR_WIDTH_INACTIVE = spacing[6];

/** 지금 보고 있는 페이지의 바 길이. 길이만으로 어디쯤인지 읽혀야 한다 */
const BAR_WIDTH_ACTIVE = spacing[20];

/** 바 사이 간격 */
const BAR_GAP = spacing[6];

/**
 * 바 자체는 4px 이라 손가락으로 겨냥할 수 없어 눌리는 면을 넓힌다.
 *
 * 위아래로는 넉넉히 넓히지만 좌우로는 간격의 절반까지만 넓힌다.
 * 그보다 넓히면 이웃한 바의 누르는 면과 겹치고,
 * 겹친 자리에서는 나중에 그려진 오른쪽 바가 탭을 가져가
 * 왼쪽 바를 누를 수 없게 된다.
 */
const HIT_SLOP = {
    top: spacing[12],
    bottom: spacing[12],
    left: BAR_GAP / 2,
    right: BAR_GAP / 2,
};

interface PageIndicatorProps {
    /** 지금 보고 있는 페이지. 0부터 센다 */
    current: number;
    /** 전체 페이지 수 */
    total: number;
    /** 바를 눌러 그 페이지로 건너뛴다. 넘기지 않으면 누를 수 없다 */
    onPressPage?: (index: number) => void;
}

interface BarProps {
    active: boolean;
    onPress?: () => void;
}

function Bar({ active, onPress }: BarProps) {
    const theme = useTheme();

    const animatedStyle = useAnimatedStyle(() => ({
        width: withTiming(active ? BAR_WIDTH_ACTIVE : BAR_WIDTH_INACTIVE, {
            duration: duration.normal,
            easing: easing.out,
        }),
        backgroundColor: withTiming(active ? theme.ui07 : theme.ui05, {
            duration: duration.fast,
            easing: easing.out,
        }),
    }));

    return (
        <Pressable onPress={onPress} disabled={!onPress} hitSlop={HIT_SLOP}>
            <Animated.View style={[styles.bar, animatedStyle]} />
        </Pressable>
    );
}

/**
 * 페이지를 넘겨 보는 화면의 진행 표시.
 *
 * 점이 아니라 바를 쓴다. 점은 모두 같은 크기라 색으로만 구분되는데,
 * 회색 두 단계의 차이는 화면 밝기에 따라 묻힌다.
 * 바는 색이 묻혀도 길이가 남는다.
 *
 * 강조색을 쓰지 않는다. 진행 표시는 눌러야 할 것이 아니라
 * 지금 어디쯤인지 알려 주는 것이고, 같은 화면의 주 행동과 다투면 안 된다.
 */
export function PageIndicator({
    current,
    total,
    onPressPage,
}: PageIndicatorProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, index) => (
                <Bar
                    key={index}
                    active={index === current}
                    onPress={onPressPage && (() => onPressPage(index))}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: BAR_GAP,
        alignItems: "center",
    },
    bar: {
        height: BAR_HEIGHT,
        borderRadius: radius.full,
    },
});
