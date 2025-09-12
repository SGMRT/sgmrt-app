import { Telemetry } from "@/src/apis/types/run";
import { getFormattedPace } from "@/src/utils/runUtils";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import TextWithUnit from "./TextWithUnit";

interface StatsIndicatorProps {
    stats: { label: string; value: string | number; unit: string }[];
    ghostTelemetry?: Telemetry | null;
    color?: "gray20" | "gray40";
    ghost?: boolean;
}

export default function StatsIndicator({
    stats,
    ghostTelemetry,
    ghost,
    color = "gray40",
}: StatsIndicatorProps) {
    const prevGhostTelemetry = useRef<Telemetry | null>(null);
    const ghostTelemetryToUse = ghostTelemetry ?? prevGhostTelemetry.current;

    const [isGhostMode, setIsGhostMode] = useState(false);

    useEffect(() => {
        if (ghost && ghostTelemetry) {
            prevGhostTelemetry.current = ghostTelemetry;
            setIsGhostMode(true);
        }
    }, [ghostTelemetry, ghost]);

    const parsePace = useCallback((text: string) => {
        const m = text.match(/(\d+)\s*[’']\s*(\d+)\s*[”"]/);
        if (!m) return 0;
        const min = Number(m[1]);
        const sec = Number(m[2]);
        if (!isFinite(min) || !isFinite(sec)) return null;
        return min * 60 + sec;
    }, []);

    const signText = useCallback(
        (num: number, display?: string) =>
            num > 0
                ? `+${display ?? num}`
                : num < 0
                ? `-${display ?? num}`
                : `${display ?? num}`,
        []
    );

    const renderGhostCompare = useCallback(
        (stat: { label: string; value: string | number; unit: string }) => {
            if (!isGhostMode || !ghostTelemetryToUse) return null;

            // 안전 변환
            const asNum = (v: string | number) =>
                typeof v === "number" ? v : Number(v);

            switch (stat.label) {
                case "거리": {
                    const myKm = asNum(stat.value);
                    const ghKm = ghostTelemetryToUse.dist;
                    if (!isFinite(myKm) || !isFinite(ghKm)) return null;

                    const diffM = Number((myKm - ghKm / 1000).toFixed(2));
                    const text = `${diffM >= 0 ? "" : ""}${diffM}`;
                    return (
                        <TextWithUnit
                            value={text}
                            unit="km"
                            variant="subhead1"
                            color={diffM >= 0 ? "primary" : "red"}
                        />
                    );
                }
                case "현재 페이스": {
                    const mySec =
                        typeof stat.value === "string"
                            ? parsePace(stat.value)
                            : null;
                    const ghSec = ghostTelemetryToUse.pace;
                    if (mySec == null || !isFinite(ghSec)) return null;

                    const deltaSec = Math.round(mySec - ghSec); // 음수면 내가 더 빠름
                    const text = signText(
                        deltaSec,
                        getFormattedPace(Math.abs(deltaSec))
                    );
                    return (
                        <TextWithUnit
                            value={text}
                            variant="subhead1"
                            color={deltaSec <= 0 ? "primary" : "red"}
                        />
                    );
                }
                case "케이던스": {
                    const mySpm = asNum(stat.value);
                    const ghSpm = ghostTelemetryToUse.cadence;
                    if (!isFinite(mySpm) || !isFinite(ghSpm)) return null;

                    const diff = Math.round(mySpm - ghSpm); // +면 내가 더 높음
                    const text = signText(diff);
                    return (
                        <TextWithUnit
                            value={text}
                            unit="spm"
                            variant="subhead1"
                            color={diff >= 0 ? "primary" : "red"}
                        />
                    );
                }
                default:
                    return null;
            }
        },
        [isGhostMode, ghostTelemetryToUse, parsePace, signText]
    );

    return (
        <View style={styles.courseInfoContainer}>
            {stats.map((stat) => (
                <View key={stat.label} style={styles.courseInfoItem}>
                    {renderGhostCompare(stat)}
                    <TextWithUnit
                        key={stat.label}
                        value={stat.value.toString()}
                        unit={stat.unit}
                        description={stat.label}
                        variant="display1"
                        color={color}
                        unitVariant="display2"
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    courseInfoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 20,
    },
    courseInfoItem: {
        width: "33%",
        alignItems: "center",
    },
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: 10,
    },
    tabItem: {
        flex: 1,
    },
    tabItemText: {
        textAlign: "center",
    },
});
