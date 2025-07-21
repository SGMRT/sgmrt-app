import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseScreen() {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(1);
    const data = [
        {
            id: 1,
            name: "소고기마라탕",
        },
        {
            id: 2,
            name: "소고기마라탕",
        },
        {
            id: 3,
            name: "소고기마라탕",
        },
    ];
    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="내 코스" />
            <CoursesWithFilter
                data={data}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
            />
            <SlideToAction
                label="이 코스로 러닝 시작"
                onSlideSuccess={() => {
                    console.log("slide success");
                }}
                color="green"
                direction="left"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        marginBottom: 20,
    },
    headerText: {
        marginBottom: 10,
    },
});
