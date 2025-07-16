import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

interface CourseFilterProps {
    type: "all" | "my";
    setType: (type: "all" | "my") => void;
}

export default function CourseFilter({ type, setType }: CourseFilterProps) {
    return (
        <View style={styles.filterContainer}>
            <Pressable>
                <Typography variant="subhead2" color="gray60">
                    필터
                </Typography>
            </Pressable>
            <Pressable onPress={() => setType("all")}>
                <Typography
                    variant="subhead2"
                    color={type === "all" ? "primary" : "gray60"}
                >
                    고스트 코스
                </Typography>
            </Pressable>
            <Pressable onPress={() => setType("my")}>
                <Typography
                    variant="subhead2"
                    color={type === "my" ? "primary" : "gray60"}
                >
                    내 코스
                </Typography>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        paddingTop: 10,
        paddingHorizontal: 17,
        flexDirection: "row",
        gap: 20,
    },
});
