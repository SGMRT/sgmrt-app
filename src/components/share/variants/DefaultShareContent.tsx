import { GhostIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, View } from "react-native";
import ResultCourseMap from "../../result/ResultCourseMap";
import StatRow, { Stat } from "../../ui/StatRow";
import { Typography } from "../../ui/Typography";
import { CommonShareProps } from "../types";

function DefaultShareContent({
    telemetries,
    onMapReady,
    width = 360,
    height = 350,
    stats = [] as Stat[],
    title,
    distance,
}: CommonShareProps) {
    return (
        <View style={styles.shareCard}>
            <View style={styles.shareCardHeader}>
                <Typography variant="display2" color="white">
                    {title}
                </Typography>
                <View style={{ flexDirection: "row", gap: 5 }}>
                    <Typography variant="share_headline" color="gray20">
                        {distance?.toString()}
                    </Typography>
                    <Typography variant="share_headline" color="gray20">
                        km
                    </Typography>
                </View>
            </View>

            <View style={[styles.mapContainer, { width, height }]}>
                <ResultCourseMap
                    telemetries={telemetries}
                    onReady={onMapReady}
                    borderRadius={20}
                    width={width}
                    height={height}
                    logoPosition={{ bottom: 10, left: 10 }}
                    attributionPosition={{ bottom: 10, left: 100 }}
                />
                <GhostIcon
                    color={colors.primary}
                    width={24}
                    height={15}
                    style={styles.ghostIcon}
                />
            </View>

            <StatRow
                stats={stats.slice(0, 4)}
                style={styles.statsContainer}
                options={{
                    color: "gray20",
                    unitColor: "gray20",
                    descriptionColor: "gray60",
                    variant: "share_stat",
                    unitVariant: "share_stat_unit",
                    descriptionVariant: "share_stat_description",
                    align: "flex-start",
                    style: { minWidth: 78 },
                }}
                divider={false}
            />
        </View>
    );
}

export default DefaultShareContent;

const styles = StyleSheet.create({
    shareCard: {
        padding: 16,
        paddingBottom: 29,
        flexDirection: "column",
        backgroundColor: "#111111",
    },
    shareCardHeader: {
        marginBottom: 10,
    },
    ghostIcon: {
        position: "absolute",
        bottom: 13,
        right: 13,
    },
    mapContainer: {
        position: "relative",
    },
    statsContainer: {
        alignItems: "flex-start",
        justifyContent: "flex-start",
        marginHorizontal: 6.5,
        gap: 12,
        marginTop: 25,
    },
});
