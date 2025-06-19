import { BackIcon } from "@/assets/svgs/svgs";
import UserWithRank from "@/src/components/map/courseInfo/UserWithRank";
import SlideToAction from "@/src/components/map/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ghostList = [
    {
        id: "1",
        name: "정윤석",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
    {
        id: "2",
        name: "정윤석",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
    {
        id: "3",
        name: "정윤석",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
    {
        id: "4",
        name: "정윤석",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
    {
        id: "5",
        name: "정윤석",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
];

export default function CourseScreen() {
    const { courseId } = useLocalSearchParams();
    const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
        ghostList[0].id
    );

    console.log(courseId);

    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <BackIcon />
                </Pressable>
                <Typography variant="subhead2" color="gray20">
                    소고기마라탕
                </Typography>
                <View style={{ width: 8.1, height: 16.2 }} />
            </View>
            <View
                style={{
                    paddingLeft: 17,
                }}
            >
                <Typography
                    variant="body1"
                    color="gray40"
                    style={styles.headerText}
                >
                    빠른 완주 순위
                </Typography>
            </View>
            <FlashList
                data={ghostList}
                renderItem={({ item, index }) => (
                    <UserWithRank
                        key={item.id}
                        rank={index + 1}
                        name={item.name}
                        avatar={item.avatar}
                        time={item.time}
                        pace={item.pace}
                        cadence={item.cadence}
                        ghostId={item.id}
                        isGhostSelected={selectedGhostId === item.id}
                        onPress={() => setSelectedGhostId(item.id)}
                    />
                )}
                estimatedItemSize={83}
                showsVerticalScrollIndicator={false}
            />
            <SlideToAction
                label="고스트와 러닝 시작"
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
