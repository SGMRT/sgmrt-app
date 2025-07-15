import { UserIcon } from "@/assets/svgs/svgs";
import { RunComperisonResponse } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { StyleSheet, View } from "react-native";
import { Divider } from "../ui/Divider";
import { Typography } from "../ui/Typography";

interface CourseNameContainerProps {
    courseName: string;
    userCount: number;
}

export default function CourseNameContainer({
    courseName,
    userCount,
}: CourseNameContainerProps) {
    return (
        <View style={styles.courseNameContainer}>
            <Typography variant="subhead1" color="white">
                {courseName}
            </Typography>
            <Divider direction="vertical" />
            <View style={styles.userCountContainer}>
                <UserIcon />
                <Typography variant="caption1" color="gray60">
                    {userCount}
                </Typography>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    userCountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    courseNameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
