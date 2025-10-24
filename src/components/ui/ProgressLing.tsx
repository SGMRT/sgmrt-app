// ProgressLing.tsx (헤드 캡 추가 + 반시계 회전 유지)
import colors from "@/src/theme/colors";
import {
    Canvas,
    Circle,
    Group,
    SweepGradient,
    useClock,
    vec,
} from "@shopify/react-native-skia";
import { View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

type Props = {
    containerSize?: number;
    radius?: number;
    strokeWidth?: number;
    duration?: number;
    headColor?: string;
    trackColor?: string;
};

export const ProgressLing = ({
    containerSize,
    radius = 30.95,
    strokeWidth = 9.285,
    duration = 1200,
    headColor = colors.primary,
    trackColor = "rgba(255,255,255,0.08)",
}: Props) => {
    const size = radius * 2;
    const cx = radius;
    const cy = radius;
    const innerR = radius - strokeWidth / 2;
    const headRadius = strokeWidth / 2;

    const t = useClock();

    // 반시계 방향 회전
    const spinTransform = useDerivedValue(() => {
        const ms = t.value % duration;
        const progress = ms / duration;
        const rad = -progress * Math.PI * 2; // 음수 = 반시계
        return [{ rotate: rad }];
    }, [duration]);

    // 스윕 그라데이션 (꼬리 쪽 투명)
    const stops = [
        { color: headColor, pos: 0 },
        { color: headColor, pos: 0.3 },
        { color: "rgba(117,117,117,0)", pos: 1 },
    ];

    return (
        <View
            style={{
                width: containerSize ?? size,
                height: containerSize ?? size,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <View style={{ width: size, height: size }}>
                <Canvas style={{ flex: 1 }}>
                    {/* 배경 트랙 */}
                    <Circle
                        cx={cx}
                        cy={cy}
                        r={innerR}
                        color={trackColor}
                        style="stroke"
                        strokeWidth={strokeWidth}
                    />

                    {/* 회전하는 링 */}
                    <Group origin={vec(cx, cy)} transform={spinTransform}>
                        {/* 본체 링 */}
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={innerR}
                            style="stroke"
                            strokeWidth={strokeWidth}
                            strokeCap="round"
                        >
                            <SweepGradient
                                c={vec(cx, cy)}
                                colors={stops.map((s) => s.color)}
                                positions={stops.map((s) => s.pos)}
                            />
                        </Circle>

                        {/* 메인 캡 */}
                        <Circle
                            cx={cx + innerR}
                            cy={cy}
                            r={headRadius}
                            color={headColor}
                        />
                    </Group>
                </Canvas>
            </View>
        </View>
    );
};
