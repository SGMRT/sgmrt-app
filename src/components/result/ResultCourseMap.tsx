import { Telemetry } from "@/src/apis/types/run";
import colors from "@/src/theme/colors";
import {
    calculateCenter,
    calculateZoomLevelFromSize,
    convertTelemetriesToCourse,
} from "@/src/utils/mapUtils";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { MarkerView } from "@rnmapbox/maps";
import { Link } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Dimensions, InteractionManager, StyleSheet, View } from "react-native";
import { SharedValue, runOnJS, useDerivedValue } from "react-native-reanimated";
import CourseLayer from "../map/CourseLayer";
import MapViewWrapper from "../map/MapViewWrapper";
import { Divider } from "../ui/Divider";
import { Typography } from "../ui/Typography";

interface ResultCourseMapProps {
    telemetries: Telemetry[];
    isActive?: boolean;
    isChartActive?: SharedValue<boolean>;
    chartPointIndex?: SharedValue<number>;
    yKey?: "pace" | "alt";
    onReady?: () => void;
    logoPosition?: any;
    attributionPosition?: any;
    borderRadius?: number;
    width?: number;
    height?: number;
}

export default function ResultCourseMap({
    telemetries,
    isActive = true,
    isChartActive,
    chartPointIndex,
    yKey = "pace",
    onReady,
    logoPosition = { bottom: 10, left: 10 },
    attributionPosition = { bottom: 10, right: 10 },
    borderRadius = 20,
    width = Dimensions.get("window").width - 34,
    height = 260,
}: ResultCourseMapProps) {
    const [active, setActive] = useState(false);
    const [index, setIndex] = useState<number>(0);

    const readyRef = useRef<boolean>(false);

    const handleFullyRendered = () => {
        InteractionManager.runAfterInteractions(() => {
            if (!readyRef.current) {
                readyRef.current = true;
                if (onReady) {
                    onReady();
                }
            }
        });
    };

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

    const center = useMemo(
        () =>
            calculateCenter(
                telemetries.map((telemetry) => ({
                    lat: telemetry.lat,
                    lng: telemetry.lng,
                }))
            ),
        [telemetries]
    );

    if (telemetries.length === 0) return null;

    return (
        <View style={[styles.mapContainer, { borderRadius, width, height }]}>
            <MapViewWrapper
                controlEnabled={false}
                showPuck={false}
                center={center}
                zoom={calculateZoomLevelFromSize(
                    center.size,
                    center.latitude,
                    width
                )}
                logoEnabled={true}
                logoPosition={logoPosition}
                attributionEnabled={false}
                onRegionDidChange={handleFullyRendered}
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
            <Typography
                variant="caption1"
                color="gray40"
                style={[styles.attribution, attributionPosition]}
            >
                <Link href="https://www.mapbox.com/">© Mapbox</Link>{" "}
                <Link href="https://www.openstreetmap.org/copyright">
                    © OpenStreetMap
                </Link>
            </Typography>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        height: 260,
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
    attribution: {
        position: "absolute",
    },
});
