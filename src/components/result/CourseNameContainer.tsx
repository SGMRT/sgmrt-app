import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

interface CourseNameContainerProps {
    courseName: string;
    onPress?: () => void;
}

export default function CourseNameContainer({
    courseName,
    onPress,
}: CourseNameContainerProps) {
    return (
        <Pressable onPress={onPress}>
            <View style={styles.courseNameContainer}>
                <Typography variant="caption1" color="gray60">
                    {courseName}
                </Typography>
                <ChevronIcon color={colors.gray[60]} width={14} height={14} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    courseNameContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});
