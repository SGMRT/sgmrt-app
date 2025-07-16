import { ChevronIcon, UserIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, View } from "react-native";
import { Divider } from "../../ui/Divider";
import RadioButton from "../../ui/RadioButton";
import StatRow from "../../ui/StatRow";
import { Typography } from "../../ui/Typography";

interface CourseInfoItemProps {
    isSelected: boolean;
    onPress: () => void;
}

export default function CourseInfoItem({
    isSelected,
    onPress,
}: CourseInfoItemProps) {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <CourseHeader />
                <StatRow
                    style={{
                        gap: 10,
                    }}
                    stats={[
                        {
                            value: "10.0",
                            unit: "km",
                        },
                        {
                            value: "24:21",
                        },
                        {
                            value: "8'23''",
                        },
                        {
                            value: "124",
                            unit: "spm",
                        },
                    ]}
                    variant="body1"
                />
            </View>
            <RadioButton
                isSelected={isSelected}
                showMyRecord={false}
                onPress={onPress}
            />
        </View>
    );
}

const CourseHeader = () => {
    return (
        <View style={styles.headerContainer}>
            <Typography variant="body1" color="white">
                집앞코스
            </Typography>
            <View style={styles.titleRightSection}>
                <Typography variant="caption1" color="gray60">
                    2025.06.17
                </Typography>
                <Divider />
                <View style={styles.userCountContainer}>
                    <UserIcon />
                    <Typography variant="caption1" color="gray60">
                        100
                    </Typography>
                </View>
                <ChevronIcon color={colors.gray[60]} width={16} height={16} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 10,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    leftSection: {
        gap: 2,
    },
    titleRightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    userCountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
