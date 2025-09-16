import { GhostIcon } from "@/assets/svgs/svgs";
import { Telemetry } from "@/src/apis/types/run";
import ResultCourseMap from "@/src/components/result/ResultCourseMap";
import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";
import StatRow, { Stat } from "../ui/StatRow";
import { Typography } from "../ui/Typography";

type RunShotProps = {
    fileName?: string;
    telemetries: Telemetry[];
    type: "share" | "thumbnail";
    onMapReady?: () => void;

    title: string;
    distance?: string | number;
    stats?: Stat[];

    width?: number;
    height?: number;

    backgroundColor?: string;
};

export type RunShotHandle = {
    capture: () => Promise<string | null>;
};

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 350;

const RunShot = forwardRef<RunShotHandle, RunShotProps>(
    (
        {
            fileName,
            telemetries,
            type,
            title,
            distance = "0.00",
            stats = [] as Stat[],
            onMapReady,
            width = DEFAULT_WIDTH,
            height = DEFAULT_HEIGHT,
            backgroundColor = "#111111",
        },
        ref
    ) => {
        const viewShotRef = useRef<ViewShot>(null);

        useImperativeHandle(ref, () => ({
            async capture() {
                try {
                    const uri = await viewShotRef.current?.capture?.();
                    if (!uri) return null;
                    return uri.startsWith("file://") ? uri : "file://" + uri;
                } catch (e) {
                    console.log("RunShot.capture error:", e);
                    return null;
                }
            },
        }));

        return (
            <View pointerEvents="none" style={styles.container} collapsable>
                <ViewShot
                    ref={viewShotRef}
                    options={{
                        fileName: fileName,
                        format: "jpg",
                        quality: 0.9,
                    }}
                >
                    {type === "thumbnail" ? (
                        <ThumbnailContent
                            telemetries={telemetries}
                            onMapReady={onMapReady}
                            width={width}
                            height={height}
                        />
                    ) : (
                        <ShareContent
                            telemetries={telemetries}
                            onMapReady={onMapReady}
                            stats={stats}
                            title={title}
                            distance={distance}
                            width={width}
                            height={height}
                            backgroundColor={backgroundColor}
                        />
                    )}
                </ViewShot>
            </View>
        );
    }
);

const ThumbnailContent = memo(function ThumbnailContent({
    telemetries,
    onMapReady,
    width = 360,
    height = 360,
}: {
    telemetries: Telemetry[];
    onMapReady?: () => void;
    width?: number;
    height?: number;
}) {
    return (
        <ResultCourseMap
            telemetries={telemetries}
            onReady={onMapReady}
            borderRadius={0}
            width={width}
            height={height}
            logoPosition={{ bottom: 10, left: 10 }}
            attributionPosition={{ bottom: 10, left: 100 }}
        />
    );
});

const ShareContent = memo(function ShareContent({
    telemetries,
    onMapReady,
    width = 360,
    height = 350,
    stats = [] as Stat[],
    title,
    distance,
    backgroundColor = "#111111",
}: {
    telemetries: Telemetry[];
    onMapReady?: () => void;
    width?: number;
    height?: number;
    stats?: Stat[];
    title: string;
    distance: string | number;
    backgroundColor?: string;
}) {
    return (
        <View style={[styles.shareCard, { backgroundColor }]}>
            <View style={styles.shareCardHeader}>
                <Typography variant="share_subhead" color="white">
                    {title}
                </Typography>
                <View style={{ flexDirection: "row", gap: 5 }}>
                    <Typography variant="share_headline" color="gray20">
                        {distance.toString()}
                    </Typography>
                    <Typography variant="share_headline" color="gray20">
                        km
                    </Typography>
                </View>
            </View>

            <View style={styles.mapContainer}>
                <ResultCourseMap
                    telemetries={telemetries}
                    onReady={onMapReady}
                    borderRadius={20}
                    width={width}
                    height={height}
                    logoPosition={{ bottom: 10, left: 10 }}
                    attributionPosition={{ bottom: 10, left: 100 }}
                />
                <GhostIcon width={20} height={20} style={styles.ghostIcon} />
            </View>

            <StatRow
                stats={stats}
                style={styles.statsContainer}
                options={{
                    color: "gray20",
                    unitColor: "gray20",
                    descriptionColor: "gray60",
                    variant: "share_stat",
                    unitVariant: "share_stat_unit",
                    descriptionVariant: "share_stat_description",
                    align: "center",
                    style: { width: 77.07 },
                }}
                divider={false}
            />
        </View>
    );
});

RunShot.displayName = "RunShot";

export default RunShot;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1000,
    },
    shareCard: {
        padding: 16,
        paddingBottom: 36,
        flexDirection: "column",
    },
    shareCardHeader: {
        marginBottom: 10,
    },
    ghostIcon: {
        position: "absolute",
        bottom: 16,
        right: 16,
    },
    mapContainer: {
        position: "relative",
    },
    statsContainer: {
        justifyContent: "space-between",
        marginTop: 25,
    },
});
