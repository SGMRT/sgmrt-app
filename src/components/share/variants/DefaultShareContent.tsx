import { GhostIcon } from "@/assets/svgs/svgs";
import { StyleSheet, View } from "react-native";
import ResultCourseMap from "../../result/ResultCourseMap";
import { Stat, StatRow, Typography } from "@/src/components/ui";
import { CommonShareProps } from "../types";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";

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
                <View style={{ flexDirection: "row", gap: spacing[4] }}>
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
                    color={darkTheme.primary}
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
        paddingVertical: spacing[28],
        flexDirection: "column",
        backgroundColor: darkTheme.uiBackground,
    },
    shareCardHeader: {
        marginBottom: spacing[8],
        marginLeft: 16,
    },
    ghostIcon: {
        position: "absolute",
        bottom: 13,
        right: 13,
    },
    mapContainer: {
        position: "relative",
        marginHorizontal: 16,
    },
    statsContainer: {
        alignItems: "flex-start",
        justifyContent: "flex-start",
        marginLeft: 16,
        gap: 12,
        marginTop: 24,
    },
});
