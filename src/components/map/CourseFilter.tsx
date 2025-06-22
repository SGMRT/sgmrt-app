import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

export default function CourseFilter() {
    return (
        <View style={styles.filterContainer}>
            <Pressable>
                <Typography variant="subhead2" color="gray60">
                    필터
                </Typography>
            </Pressable>
            <Pressable>
                <Typography variant="subhead2" color="primary">
                    고스트 코스
                </Typography>
            </Pressable>
            <Pressable>
                <Typography variant="subhead2" color="gray60">
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
