import { Typography } from "@/src/components/ui/Typography";
import { Course } from "@/src/types/course";
import { Image, Pressable, StyleSheet, View } from "react-native";

interface CourseTitleProps {
    course: Course;
    onClickCourse: (course: Course) => void;
    isActive: boolean;
    zoomLevel: number;
}

export default function CourseTitle({
    course,
    onClickCourse,
    isActive,
    zoomLevel,
}: CourseTitleProps) {
    const userCountWithoutTopUsers = course.count - course.topUsers.length;

    return (
        <Pressable onPress={() => onClickCourse(course)}>
            <View style={styles.container}>
                <View style={styles.titleContainer}>
                    <Typography
                        variant="subhead3"
                        color={isActive ? "white" : "gray20"}
                    >
                        {course.name}
                    </Typography>
                </View>
                {zoomLevel > 14.5 && (
                    <View style={styles.topUsersContainer}>
                        {course.topUsers.map((user, index) => (
                            <Image
                                key={user.userId}
                                source={{ uri: user.profileImage }}
                                style={[
                                    styles.topUserImage,
                                    {
                                        marginLeft: index === 0 ? 0 : -14,
                                    },
                                ]}
                            />
                        ))}
                        {userCountWithoutTopUsers > 0 && (
                            <View style={styles.userCountContainer}>
                                <Typography variant="body2" color="gray40">
                                    +{userCountWithoutTopUsers}
                                </Typography>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
        alignItems: "center",
    },
    titleContainer: {
        backgroundColor: "rgba(63, 63, 63, 0.8)",
        height: 33,
        justifyContent: "center",
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    topUsersContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    topUserImage: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: "white",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    userCountContainer: {
        backgroundColor: "rgba(63, 63, 63, 0.8)",
        borderRadius: 100,
        width: 40,
        height: 40,
        marginLeft: -14,
        justifyContent: "center",
        alignItems: "center",
    },
});
