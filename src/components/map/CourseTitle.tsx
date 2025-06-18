import { Typography } from "@/src/components/ui/Typography";
import { Course } from "@/src/types/course";
import { Image, Pressable, View } from "react-native";

interface CourseTitleProps {
    course: Course;
    onClickCourse: (course: Course) => void;
}

export default function CourseTitle({
    course,
    onClickCourse,
}: CourseTitleProps) {
    const userCountWithoutTopUsers = course.count - course.topUsers.length;

    return (
        <Pressable onPress={() => onClickCourse(course)}>
            <View style={{ gap: 10, alignItems: "center" }}>
                <View
                    style={{
                        backgroundColor: "rgba(63, 63, 63, 0.8)",
                        height: 33,
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        borderRadius: 5,
                    }}
                >
                    <Typography variant="subhead3" color="white">
                        {course.name}
                    </Typography>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {course.topUsers.map((user, index) => (
                        <Image
                            key={user.userId}
                            source={{ uri: user.profileImage }}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 100,
                                marginLeft: index === 0 ? 0 : -14,
                                backgroundColor: "white",
                                boxShadow:
                                    "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
                            }}
                        />
                    ))}
                    {userCountWithoutTopUsers > 0 && (
                        <View
                            style={{
                                backgroundColor: "rgba(63, 63, 63, 0.8)",
                                borderRadius: 100,
                                width: 40,
                                height: 40,
                                marginLeft: -14,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="body2" color="gray40">
                                +{userCountWithoutTopUsers}
                            </Typography>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
