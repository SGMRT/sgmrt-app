import { Pacemaker } from "@/src/apis/types/ghosty";
import colors from "@/src/theme/colors";
import { Fragment, useMemo } from "react";
import { View } from "react-native";
import { Typography } from "../../ui/Typography";
import { Divider } from "./Divider";
import { PhaseBar } from "./PhaseBar";
import { styles } from "./styles";
import { computePhaseTimes, getPaceRange, heightForPace } from "./utils";

type IntervalTimelineProps = {
    pacemaker: Pacemaker;
    gap?: number;
    minBarHeight?: number;
    maxBarHeight?: number;
    minBarWidth?: number;
    fastColor?: string;
    slowColor?: string;
};

export default function IntervalTimeline({
    pacemaker,
    gap = 2,
    minBarHeight = 2,
    maxBarHeight = 50,
    minBarWidth = 35,
    fastColor = colors.primary,
    slowColor = colors.gray[40],
}: IntervalTimelineProps) {
    const sets = pacemaker.sets;
    const warmSet = sets[0];
    const coolSet = sets[sets.length - 1];
    const mainSets = sets.slice(1, -1);

    // 높이: 페이스가 빠를수록(숫자 작을수록) 더 높게
    const paceRange = useMemo<[number, number]>(
        () => getPaceRange(sets),
        [sets]
    );

    const warmH = useMemo(
        () =>
            heightForPace(warmSet.pace, paceRange, minBarHeight, maxBarHeight),
        [warmSet.pace, paceRange, minBarHeight, maxBarHeight]
    );
    const coolH = useMemo(
        () =>
            heightForPace(coolSet.pace, paceRange, minBarHeight, maxBarHeight),
        [coolSet.pace, paceRange, minBarHeight, maxBarHeight]
    );
    const mainHs = useMemo(
        () =>
            mainSets.map((s) =>
                heightForPace(s.pace, paceRange, minBarHeight, maxBarHeight)
            ),
        [mainSets, paceRange, minBarHeight, maxBarHeight]
    );

    // 너비: 시간(minute) 기반
    const { warmMin, mainMins, coolMin } = useMemo(() => {
        return computePhaseTimes({
            sets,
            timeTable: pacemaker.timeTable,
        });
    }, [sets, pacemaker.timeTable]);

    const totalMainMin = useMemo(
        () => mainMins.reduce((a, b) => a + b, 0),
        [mainMins]
    );

    // 색상(빠른지 여부)
    const warmColor = pacemaker.pace >= warmSet.pace ? fastColor : slowColor;
    const mainColors = useMemo(
        () =>
            mainSets.map((s) =>
                pacemaker.pace >= s.pace ? fastColor : slowColor
            ),
        [mainSets, pacemaker.pace, fastColor, slowColor]
    );
    const coolColor = pacemaker.pace >= coolSet.pace ? fastColor : slowColor;

    return (
        <View style={styles.root}>
            {/* 상단 바 영역 */}
            <View style={[styles.barsRow, { gap, height: 50 }]}>
                {/* 워밍업 */}
                <View style={{ width: minBarWidth + 4 }}>
                    <PhaseBar height={warmH} color={warmColor} />
                </View>

                {/* 메인 세트들 */}
                {mainSets.map((_, i) => (
                    <Fragment key={i}>
                        <View
                            style={{
                                flexGrow: mainMins[i],
                                flexBasis: 0,
                                minWidth: 2,
                            }}
                        >
                            <PhaseBar
                                height={mainHs[i]}
                                color={mainColors[i]}
                            />
                        </View>
                    </Fragment>
                ))}

                {/* 쿨다운 */}
                <View style={{ width: minBarWidth + 4 }}>
                    <PhaseBar height={coolH} color={coolColor} />
                </View>
            </View>

            {/* 하단 라벨 영역 */}
            <View style={[styles.labelsRow, { gap }]}>
                {/* 워밍업 */}
                <View
                    style={{
                        width: minBarWidth,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="caption1" color="white">
                        {`${warmMin} min`}
                    </Typography>
                    <Typography
                        variant="caption1"
                        color="gray60"
                        style={styles.centerText}
                    >
                        {"warm up"}
                    </Typography>
                </View>

                <Divider />

                {/* 메인 (총합 + summary) */}
                <View
                    style={{
                        flexGrow: 1,
                        flexBasis: 0,
                        minWidth: minBarWidth,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="caption1" color="white">
                        {`${totalMainMin} min`}
                    </Typography>
                    <Typography
                        variant="caption1"
                        color="gray60"
                        style={styles.centerText}
                    >
                        {pacemaker.summary}
                    </Typography>
                </View>

                <Divider />

                {/* 쿨다운 */}
                <View
                    style={{
                        width: minBarWidth,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="caption1" color="white">
                        {`${coolMin} min`}
                    </Typography>
                    <Typography
                        variant="caption1"
                        color="gray60"
                        style={styles.centerText}
                    >
                        {"cool down"}
                    </Typography>
                </View>
            </View>
        </View>
    );
}
