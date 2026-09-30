import { ChevronIcon } from "@/assets/svgs/svgs";
import StyledChart from "@/src/components/chart/StyledChart";
import { Divider, Section, Stat, StatRow, Typography } from "@/src/components/ui";
import { Pressable, StyleSheet, View } from "react-native";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";

export const CourseInfoSection = ({
    courseName,
    stats,
    data = null,
    onPress,
}: {
    courseName: string;
    stats: Stat[];
    data?: any[] | null;
    onPress: () => void;
}) => {
    return (
        <View style={styles.courseInfoSection}>
            <Section style={styles.courseInfoSectionContent}>
                <View style={styles.courseInfoSectionTitle}>
                    <View style={styles.courseInfoSectionTitleText}>
                        <Typography variant="subhead1" color="gray20">
                            {courseName}
                        </Typography>
                        <Pressable
                            style={styles.courseInfoSectionTitleTextButton}
                            onPress={onPress}
                        >
                            <Typography variant="caption1" color="gray40">
                                코스 상세
                            </Typography>
                            <ChevronIcon color={darkTheme.ui07} />
                        </Pressable>
                    </View>
                    <Divider direction="horizontal" />
                </View>
                <StatRow
                    stats={stats}
                    color="gray20"
                    style={styles.courseInfoSectionStats}
                />
                {data && (
                    <StyledChart
                        label="고도"
                        data={data}
                        xKey="dist"
                        yKeys={["alt"]}
                    />
                )}
            </Section>
        </View>
    );
};

const styles = StyleSheet.create({
    courseInfoSection: {
        marginHorizontal: screenGutter,
    },
    courseInfoSectionTitle: {
        marginBottom: spacing[4],
        gap: spacing[8],
    },
    courseInfoSectionTitleText: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    courseInfoSectionTitleTextButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    courseInfoSectionStats: {
        gap: 20,
    },
    courseInfoSectionContent: {
        gap: spacing[16],
    },
});
