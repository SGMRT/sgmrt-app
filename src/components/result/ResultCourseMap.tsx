import { Telemetry } from "@/src/apis/types/run";
import colors from "@/src/theme/colors";
import {
    calculateZoomLevelFromSize,
    convertTelemetriesToCourse,
} from "@/src/utils/mapUtils";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { MarkerView } from "@rnmapbox/maps";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue, runOnJS, useDerivedValue } from "react-native-reanimated";
import CourseLayer from "../map/CourseLayer";
import MapViewWrapper from "../map/MapViewWrapper";
import { Divider } from "../ui/Divider";
import { Typography } from "../ui/Typography";

interface ResultCourseMapProps {
    center: {
        latitude: number;
        longitude: number;
        size: number;
    };
    telemetries: Telemetry[];
    isActive?: boolean;
    isChartActive?: SharedValue<boolean>;
    chartPointIndex?: SharedValue<number>;
    yKey?: "pace" | "alt";
}

export default function ResultCourseMap({
    center,
    telemetries,
    isActive = true,
    isChartActive,
    chartPointIndex,
    yKey = "pace",
}: ResultCourseMapProps) {
    const [active, setActive] = useState(false);
    const [index, setIndex] = useState<number>(0);

    useDerivedValue(() => {
        runOnJS(setActive)(isChartActive?.value ?? false);
        runOnJS(setIndex)(chartPointIndex?.value ?? 0);
    });

    const markerCoordinate = useMemo(() => {
        if (!active) return null;
        if (!telemetries || telemetries.length === 0) return null;
        const safeIndex = Math.min(Math.max(index, 0), telemetries.length - 1);
        const t = telemetries[safeIndex];
        if (!t) return null;
        return [t.lng, t.lat] as [number, number];
    }, [active, index, telemetries]);

    return (
        <View style={styles.mapContainer}>
            <MapViewWrapper
                controlEnabled={false}
                showPuck={false}
                center={center}
                zoom={calculateZoomLevelFromSize(center.size, center.latitude)}
                logoEnabled={false}
                attributionEnabled={false}
            >
                <CourseLayer
                    course={convertTelemetriesToCourse(telemetries ?? [])}
                    isActive={active ? false : isActive}
                    onClickCourse={() => {}}
                />
                {markerCoordinate && (
                    <>
                        <MarkerView
                            id="chart-point-marker"
                            coordinate={markerCoordinate}
                            anchor={{ x: 0.5, y: 1.0 }}
                        >
                            <View style={styles.chartMarkerTextContainer}>
                                <Typography variant="caption1" color="gray20">
                                    {getRunTime(
                                        Math.floor(
                                            telemetries[index].timeStamp / 1000
                                        ),
                                        "HH:MM:SS"
                                    )}
                                </Typography>
                                <Divider color={colors.gray[40]} />
                                <Typography variant="caption1" color="gray20">
                                    {yKey === "pace"
                                        ? getFormattedPace(
                                              telemetries[index].pace
                                          )
                                        : Math.round(telemetries[index].alt) +
                                          "m"}
                                </Typography>
                            </View>
                        </MarkerView>
                        <MarkerView
                            id="chart-point-marker"
                            coordinate={markerCoordinate}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.chartMarker} />
                        </MarkerView>
                    </>
                )}
            </MapViewWrapper>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        height: 260,
        borderRadius: 20,
        overflow: "hidden",
        width: "100%",
    },
    chartMarkerContainer: {
        gap: 6,
        alignItems: "center",
    },
    chartMarkerTextContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(63, 63, 63, 0.8)",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    chartMarker: {
        width: 8,
        height: 8,
        borderRadius: 7,
        backgroundColor: colors.primary,
        borderColor: "#FFFFFF",
    },
});
