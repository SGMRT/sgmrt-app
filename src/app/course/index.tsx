import CourseInfoItem from "@/src/components/map/courseInfo/CourseInfoItem";
import ExpendHeader from "@/src/components/ui/ExpendHeader";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { FlashList } from "@shopify/flash-list";
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
            <ExpendHeader
                title="2025"
                titleColor="gray40"
                marginHorizontal={true}
                rightChildren={
                    <Typography variant="body1" color="gray60">
                        필터
                    </Typography>
                }
            />
            <FlashList
                data={data}
                renderItem={({ item, index }) => (
                    <CourseInfoItem
                        isSelected={selectedCourseId === item.id}
                        onPress={() => setSelectedCourseId(item.id)}
                    />
                )}
                contentContainerStyle={{
                    paddingHorizontal: 17,
                }}
                showsVerticalScrollIndicator={false}
                extraData={selectedCourseId}
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
