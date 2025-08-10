import colors from "@/src/theme/colors";
import { useFont } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { Typography } from "../ui/Typography";

interface StyledChartProps {
    label: string;
    data: any[];
    xKey: string;
    yKeys: string[];
    showToolTip?: boolean;
    invertYAxis?: boolean;
}

// interface ToolTipProps {
//     data: any[];
//     x: SharedValue<number>;
//     index: SharedValue<number>;
// }

// function ToolTip({ data, x, index }: ToolTipProps) {
//     const [time, setTime] = useState("");
//     const [tooltipWidth, setTooltipWidth] = useState(40);
//     // 34: padding, 10: margin
//     const maxX = Dimensions.get("window").width - 34 - tooltipWidth - 10;

//     const animatedStyle = useAnimatedStyle(() => ({
//         transform: [{ translateX: Math.min(x.value, maxX) }],
//     }));

//     useAnimatedReaction(
//         () => Math.round(index.value),
//         (i) => {
//             if (i < 0 || i >= data.length) return;

//             const runTime = data[i].timeStamp / 1000;
//             const hours = Math.floor(runTime / 3600);
//             const minutes = Math.floor((runTime % 3600) / 60);
//             const seconds = Math.floor(runTime % 60);

//             const formatted =
//                 hours > 0
//                     ? `${hours.toString().padStart(2, "0")}:${minutes
//                           .toString()
//                           .padStart(2, "0")}:${seconds
//                           .toString()
//                           .padStart(2, "0")}`
//                     : `${minutes.toString().padStart(2, "0")}:${seconds
//                           .toString()
//                           .padStart(2, "0")}`;

//             runOnJS(setTime)(formatted);
//         },
//         [index]
//     );

//     return (
//         <Animated.View
//             style={[styles.tooltip, animatedStyle]}
//             onLayout={(e) => {
//                 const w = e.nativeEvent.layout.width;
//                 setTooltipWidth(w);
//             }}
//         >
//             <Typography variant="caption1" color="gray20">
//                 {time}
//             </Typography>
//         </Animated.View>
//     );
// }

const StyledChart = ({
    label,
    data,
    xKey,
    yKeys,
    showToolTip = true,
    invertYAxis = false,
}: StyledChartProps) => {
    const font = useFont(
        require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        12
    );
    // const { state, isActive } = useChartPressState({
    //     x: 0,
    //     y: { [yKeys[0]]: 0 },
    // });

    return (
        <View>
            {showToolTip && (
                <View style={styles.tooltipContainer}>
                    <Typography variant="body3" color="gray40">
                        {label}
                    </Typography>
                </View>
            )}
            <View style={styles.container}>
                <CartesianChart
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
                                      ),
                                      data.reduce(
                                          (min, item) =>
                                              Math.min(min, item[yKeys[0]]),
                                          Infinity
                                      ),
                                  ]
                                : undefined,
                    }}
                    xAxis={{
                        font: font,
                        formatXLabel: (label) => {
                            return `${label / 1000}`;
                        },
                        axisSide: "top",
                        labelColor: colors.gray[60],
                        enableRescaling: true,
                        lineWidth: 0.5,
                        lineColor: "#2e2e2e",
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
                        <Line
                            points={points[yKeys[0]]}
                            strokeWidth={1}
                            color={colors.primary}
                            curveType="basis"
                        />
                    )}
                </CartesianChart>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 70,
        backgroundColor: "#1B1B1B",
        borderRadius: 8,
        padding: 10,
    },
    tooltipContainer: {
        height: 24,
        alignItems: "center",
        justifyContent: "flex-end",
        alignSelf: "flex-start",
        backgroundColor: colors.gray[80],
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
