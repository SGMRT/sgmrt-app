import { useState } from "react";
import { StyleSheet, View } from "react-native";
import CourseInfoItem from "./CourseInfoItem";

export default function CoursesInfoList() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <View style={styles.container}>
            <CourseInfoItem
                isSelected={selectedIndex === 0}
                onPress={() => setSelectedIndex(0)}
            />
            <CourseInfoItem
                isSelected={selectedIndex === 1}
                onPress={() => setSelectedIndex(1)}
            />
            <CourseInfoItem
                isSelected={selectedIndex === 2}
                onPress={() => setSelectedIndex(2)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 20,
    },
});
