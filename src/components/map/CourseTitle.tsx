import { DefaultProfileIcon } from "@/assets/icons/icons";
import { ChevronIcon, GhostIcon } from "@/assets/svgs/svgs";
import { CourseResponse } from "@/src/apis/types/course";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

interface CourseTitleProps {
    course: CourseResponse;
    onClickCourse: (course: CourseResponse) => void;
    isActive: boolean;
    zoomLevel: number;
    logo?: boolean;
}

export default function CourseTitle({
    course,
    onClickCourse,
    isActive,
    zoomLevel,
    logo = false,
}: CourseTitleProps) {
    return (
        <Pressable
            style={styles.container}
            onPress={() => onClickCourse(course)}
        >
            <View style={styles.titleContainer}>
                {logo && (
                    <View style={styles.logoContainer}>
                        <GhostIcon width={20} height={12.5} />
                    </View>
                )}
                <View style={styles.title}>
                    <Typography variant="subhead3" color="white">
                        {course.name}
                    </Typography>
                    <ChevronIcon color={colors.white} width={15} height={18} />
                </View>
            </View>
            {zoomLevel > 14.5 && (
                <View style={styles.topUsersContainer}>
                    {course.runners.map((user, index) => (
                        <View
                            key={user.uuId + index.toString()}
                            style={{ marginLeft: index === 0 ? 0 : -14 }}
                        >
                            <Image
                                source={
                                    user.profileUrl
                                        ? {
                                              uri: user.profileUrl.split(
                                                  "?X-Amz-"
                                              )[0],
                                          }
                                        : DefaultProfileIcon
                                }
                                style={styles.topUserImage}
                            />
                            {!isActive && (
                                <View style={styles.grayscaleOverlay} />
                            )}
                        </View>
                    ))}
                    {course.runnersCount - course.runners.length > 0 && (
                        <View style={styles.userCountContainer}>
                            <Typography variant="body3" color="gray40">
                                +{course.runnersCount}
                            </Typography>
                        </View>
                    )}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
        alignItems: "center",
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    title: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(63, 63, 63, 0.8)",
        height: 34,
        justifyContent: "center",
        borderRadius: 10,
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
        gap: 1,
        paddingLeft: 12,
        paddingRight: 7,
    },
    logoContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(226, 255, 0, 0.2)",
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
    grayscaleOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 24,
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
