import { Telemetry } from "@/src/apis/types/run";
import { getFormattedPace } from "@/src/utils/runUtils";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Divider } from "./Divider";
import TextWithUnit from "./TextWithUnit";
import { Typography } from "./Typography";

interface StatsIndicatorProps {
    stats: { label: string; value: string | number; unit: string }[];
    ghostTelemetry?: Telemetry | null;
    color?: "gray20" | "gray40";
    ghost?: boolean;
}

/**
 * Displays a set of numeric stats in a compact grid and, optionally, a ghost-vs-user comparison.
 *
 * Renders either a "solo" grid of all provided stats or, when `ghost` is enabled and ghost telemetry
 * is available (current or previously provided), a three-row comparison (distance, cadence, pace)
 * between the ghost data and the corresponding stats from `stats`. The component preserves the last
 * non-null `ghostTelemetry` in a ref so the comparison view can remain available if the prop becomes
 * undefined while `ghost` remains enabled.
 *
 * @param stats - Array of stat objects shown in the solo view; each object should include `label`, `value`, and `unit`.
 * @param ghostTelemetry - Optional telemetry used as the "ghost" values for the comparison view.
 * @param ghost - When true, shows a two-tab header to switch between solo and comparison views (comparison only renders if ghost telemetry exists or was previously provided).
 * @param color - Text color theme for stat values (defaults to `"gray40"`).
 * @returns A React element that renders the stats and optional ghost comparison UI.
 */
export default function StatsIndicator({
    stats,
    ghostTelemetry,
    ghost,
    color = "gray40",
}: StatsIndicatorProps) {
    const [tab, setTab] = useState<"solo" | "comparison">("solo");
    const distance = stats.find((stat) => stat.label === "거리");
    const cadence = stats.find((stat) => stat.label === "케이던스");
    const pace = stats.find((stat) => stat.label === "평균 페이스");
    const prevGhostTelemetry = useRef<Telemetry | null>(null);
    const ghostTelemetryToUse = ghostTelemetry ?? prevGhostTelemetry.current;

    useEffect(() => {
        if (ghost && ghostTelemetry) {
            prevGhostTelemetry.current = ghostTelemetry;
        }
    }, [ghostTelemetry, ghost]);

    return (
        <View style={styles.courseInfoContainer}>
            {ghost && ghostTelemetryToUse && (
                <View style={styles.tabContainer}>
                    <Pressable
                        onPress={() => setTab("solo")}
                        style={styles.tabItem}
                    >
                        <Typography
                            variant="subhead2"
                            color={tab === "solo" ? "white" : "gray60"}
                            style={styles.tabItemText}
                        >
                            단독기록
                        </Typography>
                    </Pressable>
                    <Divider direction="vertical" />
                    <Pressable
                        onPress={() => setTab("comparison")}
                        style={styles.tabItem}
                    >
                        <Typography
                            variant="subhead2"
                            color={tab === "comparison" ? "white" : "gray60"}
                            style={styles.tabItemText}
                        >
                            기록 비교
                        </Typography>
                    </Pressable>
                </View>
            )}
            {tab === "solo"
                ? stats.map((stat) => (
                      <TextWithUnit
                          value={stat.value.toString()}
                          unit={stat.unit}
                          description={stat.label}
                          variant="display1"
                          color={color}
                          unitVariant="display2"
                          key={stat.label}
                          style={styles.courseInfoItem}
                      />
                  ))
                : ghostTelemetryToUse && (
                      <>
                          <View
                              style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  alignItems: "center",
                                  paddingHorizontal: 17,
                              }}
                          >
                              <View style={{ width: 60 }} />
                              <Typography
                                  variant="subhead1"
                                  color={"red"}
                                  style={{ textAlign: "center", width: 100 }}
                              >
                                  고스트
                              </Typography>
                              <Typography
                                  variant="subhead1"
                                  color={"primary"}
                                  style={{ textAlign: "center", width: 100 }}
                              >
                                  나
                              </Typography>
                          </View>
                          <View
                              style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  width: "100%",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 17,
                              }}
                          >
                              <Typography
                                  variant="body2"
                                  color={"gray60"}
                                  style={{ width: 60, textAlign: "center" }}
                              >
                                  거리
                              </Typography>
                              <TextWithUnit
                                  value={(
                                      ghostTelemetryToUse.dist / 1000
                                  ).toFixed(2)}
                                  unit={"km"}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                              <TextWithUnit
                                  value={distance?.value.toString() ?? ""}
                                  unit={distance?.unit ?? ""}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                          </View>
                          <View
                              style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  width: "100%",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 17,
                              }}
                          >
                              <Typography
                                  variant="body2"
                                  color={"gray60"}
                                  style={{ width: 60, textAlign: "center" }}
                              >
                                  케이던스
                              </Typography>
                              <TextWithUnit
                                  value={ghostTelemetryToUse.cadence.toString()}
                                  unit={"spm"}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                              <TextWithUnit
                                  value={cadence?.value.toString() ?? ""}
                                  unit={cadence?.unit ?? ""}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                          </View>
                          <View
                              style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  width: "100%",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 17,
                              }}
                          >
                              <Typography
                                  variant="body2"
                                  color={"gray60"}
                                  style={{ width: 60, textAlign: "center" }}
                              >
                                  페이스
                              </Typography>
                              <TextWithUnit
                                  value={getFormattedPace(
                                      ghostTelemetryToUse.pace
                                  )}
                                  unit={""}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                              <TextWithUnit
                                  value={pace?.value.toString() ?? ""}
                                  unit={""}
                                  variant="display1"
                                  color={color}
                                  unitVariant="display2"
                              />
                          </View>
                      </>
                  )}
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
