import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Circle, useFont } from "@shopify/react-native-skia";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    SharedValue,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Typography } from "../ui/Typography";

interface StyledChartProps {
    label: string;
    data: any[];
    xKey: string;
    yKeys: string[];
    showLabel?: boolean;
    showToolTip?: boolean;
    invertYAxis?: boolean;
    expandable?: boolean;
    onPointChange?: (payload: {
        index: number;
        xValue: number;
        yValue: number;
        isActive: boolean;
        xPos: number;
        yPos: number;
    }) => void;
}

const StyledChart = ({
    label,
    data,
    xKey,
    yKeys,
    showLabel = true,
    showToolTip = false,
    invertYAxis = false,
    expandable = false,
    onPointChange,
}: StyledChartProps) => {
    const font = useFont(
        require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        12
    );

    const chartHeight = useSharedValue(70);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleExpand = () => {
        const targetHeight = !isExpanded ? 120 : 70;
        chartHeight.value = withTiming(targetHeight, { duration: 300 });
        setIsExpanded(!isExpanded);
    };

    const animatedChartContainerStyle = useAnimatedStyle(() => {
        return {
            height: chartHeight.value,
        };
    });

    const { state, isActive } = useChartPressState({
        x: 0,
        y: { [yKeys[0]]: 0 },
    });

    const primaryYKey = yKeys[0];

    useDerivedValue(() => {
        if (!onPointChange) return;
        const payload = {
            index: state.matchedIndex.value,
            xValue: (state.x.value as SharedValue<number>).value,
            yValue: state.y[primaryYKey].value.value,
            isActive: state.isActive.value,
            xPos: state.x.position.value,
            yPos: state.y[primaryYKey].position.value,
        };
        runOnJS(onPointChange)(payload);
    });

    return (
        <View>
            {showLabel && (
                <View style={styles.tooltipContainer}>
                    <Typography variant="body3" color="gray20">
                        {label}
                    </Typography>
                </View>
            )}
            <View style={styles.container}>
                <Animated.View style={animatedChartContainerStyle}>
                    <CartesianChart
                        chartPressState={showToolTip ? state : undefined}
                        data={data}
                        xKey={xKey}
                        yKeys={yKeys}
                        domain={{
                            y:
                                invertYAxis && data.length > 0
                                    ? [
                                          data.reduce(
                                              (max, item) =>
                                                  Math.max(max, item[yKeys[0]]),
                                              -Infinity
                                          ) * 1.05,
                                          data.reduce(
                                              (min, item) =>
                                                  Math.min(min, item[yKeys[0]]),
                                              Infinity
                                          ) * 0.95,
                                      ]
                                    : undefined,
                        }}
                        xAxis={{
                            font: font,
                            formatXLabel: (label) => {
                                return `${label / 1000}`;
                            },
                            axisSide: "top",
                            labelColor: "#676767",
                            enableRescaling: true,
                            lineWidth: 0.5,
                            lineColor: "#676767",
                            labelOffset: 10,
                        }}
                        yAxis={[
                            {
                                lineWidth: 0,
                                lineColor: "transparent",
                            },
                        ]}
                        frame={{
                            lineColor: "transparent",
                            lineWidth: 0,
                        }}
                        domainPadding={{
                            right: 0,
                        }}
                        padding={{
                            top: 15,
                        }}
                    >
                        {({ points }) => (
                            <>
                                <Line
                                    points={points[yKeys[0]]}
                                    strokeWidth={1}
                                    color={
                                        isActive
                                            ? colors.gray[20]
                                            : colors.primary
                                    }
                                    curveType="basis"
                                />
                                {isActive && (
                                    <ToolTip
                                        x={state.x.position}
                                        y={state.y[yKeys[0]].position}
                                    />
                                )}
                            </>
                        )}
                    </CartesianChart>
                </Animated.View>
                {expandable && (
                    <TouchableOpacity
                        style={[
                            styles.chevronContainer,
                            {
                                transform: [
                                    { rotate: isExpanded ? "-90deg" : "90deg" },
                                ],
                            },
                        ]}
                        onPress={handleExpand}
                    >
                        <ChevronIcon color={colors.gray[80]} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
    return <Circle cx={x} cy={y} r={4} color={colors.primary} />;
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#222222",
        borderRadius: 8,
        padding: 10,
        gap: 10,
    },
    chevronContainer: {
        width: 20,
        height: 20,
        alignSelf: "center",
    },
    tooltipContainer: {
        height: 24,
        alignItems: "center",
        justifyContent: "flex-end",
        alignSelf: "flex-start",
        backgroundColor: "#2D2D2D",
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
        paddingHorizontal: 12,
        marginLeft: 8.5,
    },
    tooltip: {
        position: "absolute",
        top: 0,
        zIndex: 10,
        backgroundColor: colors.gray[80],
        paddingHorizontal: 8,
        paddingTop: 4,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
    },
});

export default StyledChart;
