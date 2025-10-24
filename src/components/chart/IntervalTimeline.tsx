import colors from "@/src/theme/colors";
import { PaceSet, SegmentInfo } from "@/src/types/pacemaker";
import { Fragment, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Typography } from "../ui/Typography";

type IntervalTimelineProps = {
    sets: PaceSet[];
    gap?: number;
    minBarHeight?: number;
    maxBarHeight?: number;
    minBarWidth?: number;
    fastColor?: string;
    slowColor?: string;
};

export default function IntervalTimeline({
    sets,
    gap = 2,
    minBarHeight = 2,
    maxBarHeight = 50,
    minBarWidth = 35,
    fastColor = colors.primary,
    slowColor = colors.gray[40],
}: IntervalTimelineProps) {
    const [containerW, setContainerW] = useState(0);
    const segments = sets.map((s) => s.run);

    const paceRange = useMemo(() => getPaceRange(segments), [segments]);
    const totalMinutes = useMemo(() => getTotalMinutes(segments), [segments]);

    const bars = useMemo(() => {
        const n = segments.length;
        const totalGap = gap * Math.max(0, n - 1);
        const totalWidth = containerW - totalGap;

        if (containerW <= 0 || totalMinutes <= 0) return [];

        const baseWidths = segments.map((s) => {
            const minutes = (s.endKm - s.startKm) * s.paceMinKm;
            return (minutes / totalMinutes) * totalWidth;
        });

        const widthsWithMin = baseWidths.map((w) => Math.max(w, minBarWidth));
        let sum = widthsWithMin.reduce((acc, w) => acc + w, 0);

        if (sum > totalWidth) {
            const pool = widthsWithMin.reduce(
                (a, w) => a + Math.max(0, w - minBarWidth),
                0
            );
            const over = sum - totalWidth;
            if (pool > 0) {
                for (let i = 0; i < widthsWithMin.length; i++) {
                    const overShare =
                        widthsWithMin[i] - minBarWidth > 0
                            ? over * ((widthsWithMin[i] - minBarWidth) / pool)
                            : 0;
                    widthsWithMin[i] = Math.max(
                        minBarWidth,
                        widthsWithMin[i] - overShare
                    );
                }
            }
        }

        if (sum < totalWidth) {
            const remain = totalWidth - sum;
            const baseSum = baseWidths.reduce((a, b) => a + b, 0) || 1;
            for (let i = 0; i < widthsWithMin.length; i++) {
                const add = remain * (baseWidths[i] / baseSum);
                widthsWithMin[i] += add;
            }
            sum = widthsWithMin.reduce((a, b) => a + b, 0);
        }

        const heights = segments.map((s) =>
            heightForPace(s.paceMinKm, paceRange, minBarHeight, maxBarHeight)
        );

        return segments.map((s, i) => ({
            key: `${s.startKm}-${s.endKm}-${i}`,
            width: widthsWithMin[i],
            height: heights[i],
            color: i % 2 === 1 ? fastColor : slowColor,
            minutes: (s.endKm - s.startKm) * s.paceMinKm,
            summary: sets[i].message,
        }));
    }, [
        segments,
        gap,
        minBarWidth,
        maxBarHeight,
        minBarHeight,
        fastColor,
        slowColor,
        containerW,
        totalMinutes,
    ]);

    const onLayout = (event: LayoutChangeEvent) => {
        setContainerW(event.nativeEvent.layout.width);
    };

    return (
        <View>
            <View
                onLayout={onLayout}
                style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap,
                    marginVertical: 8,
                }}
            >
                {bars.map((bar) => (
                    <View
                        key={bar.key}
                        style={{
                            width: bar.width,
                            height: bar.height,
                            backgroundColor: bar.color,
                        }}
                    />
                ))}
            </View>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap,
                }}
            >
                {bars.map((bar, i) => (
                    <Fragment key={bar.key}>
                        <View
                            style={{
                                width: bar.width + (i % 2 === 1 ? -4 : -2),
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="caption1" color="white">
                                {Math.round(bar.minutes)} min
                            </Typography>
                            <Typography
                                variant="caption1"
                                color="gray60"
                                style={{
                                    textAlign: "center",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {bar.summary}
                            </Typography>
                        </View>
                        {i < bars.length - 1 && (
                            <View
                                style={{
                                    width: 4,
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 100,
                                        borderColor: colors.primary,
                                        borderWidth: 1,
                                    }}
                                />
                                <View
                                    style={{
                                        width: 1,
                                        flex: 1,
                                        backgroundColor: "#3F3F3F",
                                    }}
                                />
                            </View>
                        )}
                    </Fragment>
                ))}
            </View>
        </View>
    );
}

const getPaceRange = (segments: SegmentInfo[]): [number, number] => {
    return [
        segments.reduce(
            (acc, segment) => Math.min(acc, segment.paceMinKm),
            Infinity
        ),
        segments.reduce(
            (acc, segment) => Math.max(acc, segment.paceMinKm),
            -Infinity
        ),
    ];
};

const getTotalMinutes = (segments: SegmentInfo[]) => {
    return segments.reduce(
        (acc, segment) =>
            acc + (segment.endKm - segment.startKm) * segment.paceMinKm,
        0
    );
};

const heightForPace = (
    pace: number,
    paceRange: [number, number],
    minBarHeight: number,
    maxBarHeight: number
) => {
    const [fast, slow] = paceRange;
    if (slow === fast) {
        return Math.round((minBarHeight + maxBarHeight) / 2);
    }
    const t = Math.max(0, Math.min(1, (slow - pace) / (slow - fast)));
    return Math.round(minBarHeight + (maxBarHeight - minBarHeight) * t);
};
