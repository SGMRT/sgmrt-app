import { darkTheme } from "@/src/design-system/themes/dark";
import {
    duration as motionDuration,
    pressScale,
    spring,
} from "@/src/design-system/tokens/motion";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { useLocalPrefs } from "@/src/store/localPrefs";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { Typography } from "@/src/components/ui";

/** 들고 나는 움직임에 쓰는 이징. 기본 곡선은 화면에서 너무 약하다 */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * 숫자가 오르내리는 데 걸리는 시간.
 *
 * 200ms 로는 바뀌는 순간이 보이지 않고 잔상만 남았다.
 * 눈으로 좇을 수 있으려면 이 정도는 걸려야 한다.
 * 화면 조작의 상한인 300ms 는 넘기지 않는다.
 */
const DURATION = 280;

/**
 * 들어오는 숫자가 제자리에 앉는 방식.
 *
 * 곧게 멈추면 숫자가 미끄러져 와서 툭 서는 느낌이 든다.
 * dampingRatio 를 1 아래로 두면 제자리를 살짝 지나쳤다 돌아와,
 * 눈금이 걸려 앉는 것처럼 읽힌다.
 * 0.6 은 한 번 정도 되돌아오는 세기다. 더 낮추면 출렁거린다.
 */
const SETTLE = { duration: 400, dampingRatio: 0.6 } as const;

/**
 * 숫자가 오르내리는 거리.
 *
 * 두 숫자를 시간이 아니라 거리로 떼어 놓는다.
 * 옛 숫자를 먼저 내보내고 새 숫자를 늦게 들이면 중간이 비어 끊겨 보인다.
 * 대신 둘을 이만큼 벌려 같은 속도로 함께 움직이게 하면,
 * 어느 순간에도 한쪽은 칸 밖에 있어 겹치지 않으면서 움직임은 이어진다.
 *
 * 칸 높이가 32 이므로 24 면 한쪽이 거의 잘려 나간다.
 */
const TRAVEL = 24;

/**
 * 값이 바뀔 때 숫자가 오르내린다.
 *
 * 올리면 새 숫자가 아래에서 올라오고 옛 숫자는 위로 빠진다.
 * 계기판의 눈금이 도는 방향과 같아서, 버튼을 보지 않아도
 * 값이 올랐는지 내렸는지 알 수 있다.
 *
 * 움직임을 줄인 기기에서는 오르내림을 빼고 흐려졌다 나타나기만 한다.
 */
function makeTransition(direction: 1 | -1, reduced: boolean) {
    const enter = () => {
        "worklet";
        return {
            initialValues: {
                opacity: 0,
                transform: [{ translateY: reduced ? 0 : direction * TRAVEL }],
            },
            animations: {
                opacity: withTiming(1, {
                    duration: DURATION,
                    easing: EASE_OUT,
                }),
                transform: [
                    // 들어오는 쪽에만 스프링을 건다.
                    // 나가는 숫자까지 튀면 둘이 같이 출렁여 어지럽다
                    { translateY: withSpring(0, SETTLE) },
                ],
            },
        };
    };

    const exit = () => {
        "worklet";
        return {
            initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
            animations: {
                opacity: withTiming(0, {
                    duration: DURATION,
                    easing: EASE_OUT,
                }),
                transform: [
                    {
                        translateY: withTiming(
                            reduced ? 0 : direction * -TRAVEL,
                            { duration: DURATION, easing: EASE_OUT },
                        ),
                    },
                ],
            },
        };
    };

    return { enter, exit };
}

/**
 * 값을 한 단계 올리거나 내리는 버튼.
 *
 * 누를 때 줄었다가 뗄 때 스프링으로 돌아온다.
 * 되돌아오며 살짝 지나치는 그 순간이 촉감을 만든다.
 * 체크와 라디오가 쓰는 것과 같은 스프링이라 앱 안에서 눌림이 한결같다.
 */
function StepButton({
    label,
    onPress,
    disabled,
}: {
    label: string;
    onPress: () => void;
    disabled: boolean;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const press = (to: number, springy: boolean) => {
        if (disabled) return;
        scale.value = springy
            ? withSpring(to, spring.press)
            : withTiming(to, { duration: motionDuration.press });
    };

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                disabled={disabled}
                onPress={onPress}
                onLongPress={onPress}
                onPressIn={() => press(pressScale.wide, false)}
                onPressOut={() => press(1, true)}
                style={[
                    styles.cadenceAssistButton,
                    disabled ? styles.disabledCadenceAssistControl : null,
                ]}
            >
                <Typography
                    variant="subhead3"
                    style={disabled ? { color: darkTheme.uiDisabledFg } : undefined}
                    color="white"
                >
                    {label}
                </Typography>
            </Pressable>
        </Animated.View>
    );
}

interface CadenceAssistControlProps {
    isEnabled: boolean;
}

export const CadenceAssistControl = ({ isEnabled }: CadenceAssistControlProps) => {
    const {
        cadenceTarget: value,
        decCadenceTarget,
        incCadenceTarget,
    } = useLocalPrefs();

    // 값이 오른 것인지 내린 것인지는 이전 값과 견주어야 알 수 있다
    const previous = useRef(value);
    const direction: 1 | -1 = value >= previous.current ? 1 : -1;
    useEffect(() => {
        previous.current = value;
    }, [value]);

    // 첫 마운트에서는 움직이지 않는다.
    //
    // 오르내림은 "값이 방금 바뀌었다" 는 뜻이다. 화면에 처음 그려질 때까지 움직이면
    // 탭을 옮겨 돌아올 때마다 숫자가 굴러 들어와, 건드리지도 않은 값이
    // 방금 바뀐 것처럼 읽힌다.
    // ref 로 두는 것은 이 값이 바뀌었다고 다시 그릴 필요가 없기 때문이다.
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
    }, []);

    const reduced = useReducedMotion();
    const { enter, exit } = makeTransition(direction, reduced);

    const digits = String(value).split("");
    const valueTextStyle = isEnabled
        ? undefined
        : { color: darkTheme.uiDisabledFg };

    return (
        <View style={styles.cadenceAssistControl}>
            <StepButton
                label="-10"
                onPress={() => decCadenceTarget(10)}
                disabled={!isEnabled}
            />

            {/* 현재 값 */}
            <View
                style={[
                    styles.cadenceAssistPanel,
                    isEnabled ? {} : styles.disabledCadenceAssistControl,
                ]}
            >
                <View style={styles.cadenceValueRow}>
                    {digits.map((digit, index) => (
                        <View
                            // 자리는 오른쪽에서부터 센다.
                            // 10 단위로 바뀌면 일의 자리는 늘 0 이라 그대로 남고,
                            // 자릿수가 늘어도(90 → 100) 오른쪽 자리는 흔들리지 않는다.
                            key={digits.length - 1 - index}
                            style={styles.digitSlot}
                        >
                            {/* 자리 너비를 잡아 주는 보이지 않는 사본.
                                움직이는 숫자는 absolute 라 폭이 0 이다 */}
                            <Typography
                                variant="subhead3"
                                color="white"
                                style={styles.digitSizer}
                            >
                                {digit}
                            </Typography>
                            {/* 숫자가 바뀐 자리만 key 가 바뀌어 움직인다 */}
                            <Animated.View
                                key={digit}
                                entering={mounted.current ? enter : undefined}
                                exiting={mounted.current ? exit : undefined}
                                style={styles.digitLayer}
                            >
                                <Typography
                                    variant="subhead3"
                                    style={valueTextStyle}
                                    color="white"
                                >
                                    {digit}
                                </Typography>
                            </Animated.View>
                        </View>
                    ))}
                    {/* 단위는 바뀌지 않으므로 움직이지 않는다 */}
                    <Typography
                        variant="subhead3"
                        style={valueTextStyle}
                        color="white"
                    >
                        {" spm"}
                    </Typography>
                </View>
            </View>

            <StepButton
                label="+10"
                onPress={() => incCadenceTarget(10)}
                disabled={!isEnabled}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    cadenceAssistControl: {
        paddingHorizontal: spacing[16],
        paddingBottom: spacing[16],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[4],
    },
    // 값을 올리고 내리는 보조 행동이다.
    // 카드(ui01) 위에 얹히므로 면을 한 단계 올려 uiUp 을 쓴다.
    // 테두리로 두면 화면에 라인 버튼이 늘어나 손댈 것과 읽을 것이 섞여 보인다.
    //
    // 면이 아니라 조작이므로 카드와의 동심 계산을 하지 않고 제 크기를 따른다.
    // 높이 32 이니 8 이다. 값 칸도 같은 줄에 선 한 덩어리라 같은 값을 쓴다.
    cadenceAssistButton: {
        height: 32,
        paddingHorizontal: spacing[12],
        borderRadius: radius.md,
        backgroundColor: darkTheme.uiUp,
        justifyContent: "center",
        alignItems: "center",
    },
    // 지금 값을 보여 줄 뿐 누를 수 없다.
    // 테두리는 누를 수 있다는 뜻이므로 여기서는 쓰지 않고 면으로 둔다.
    //
    // 면은 카드 위가 아니라 아래로 둔다.
    // 고스티의 통계 박스는 카드 안에 다시 놓인 카드라 uiUp 이 맞지만,
    // 이것은 설정 한 줄에 딸린 값 칸이라 카드보다 앞설 이유가 없다.
    // 카드보다 어두우면 파여 들어간 칸으로 읽혀 읽을 것과 누를 것이 갈린다.
    cadenceAssistPanel: {
        flex: 1,
        height: 32,
        borderRadius: radius.md,
        backgroundColor: darkTheme.uiBackground,
        justifyContent: "center",
        alignItems: "center",
        // 숫자가 칸 밖으로 넘어가는 동안 잘려 보이게 한다
        overflow: "hidden",
    },
    cadenceValueRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    digitSlot: {
        alignItems: "center",
        justifyContent: "center",
    },
    // 자리 폭만 잡고 보이지는 않는다
    digitSizer: {
        opacity: 0,
    },
    digitLayer: {
        position: "absolute",
    },
    // 이 조작은 위의 케이던스 보조 토글이 꺼지면 따라 꺼진다.
    // 제 사정으로 못 쓰게 된 것이 아니라 딸려서 꺼진 것이므로
    // 면과 테두리를 잃고 배경 높이로 내려앉는다.
    disabledCadenceAssistControl: {
        backgroundColor: darkTheme.uiBackground,
        borderColor: darkTheme.uiBackground,
    },
});
