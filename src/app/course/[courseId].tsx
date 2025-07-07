import { getCourseGhosts } from "@/src/apis";
import {
    GhostSortOption,
    HistoryResponse,
    Pageable,
} from "@/src/apis/types/course";
import UserStatItem from "@/src/components/map/courseInfo/UserStatItem";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { Typography } from "@/src/components/ui/Typography";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseScreen() {
    const { courseId } = useLocalSearchParams();
    const [selectedGhostId, setSelectedGhostId] = useState<number | null>(null);
    const router = useRouter();

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(30);
    const [sort, setSort] = useState<GhostSortOption>(
        "runningRecord.duration,asc"
    );
    const [ghostList, setGhostList] = useState<HistoryResponse[]>([]);

    const pageable: Pageable = useMemo(
        () => ({
            page: page,
            size: size,
            sort: sort,
        }),
        [page, size, sort]
    );

    useEffect(() => {
        const fetchGhosts = async () => {
            if (!courseId) return;
            const res = await getCourseGhosts({
                courseId: Number(courseId),
                pageable: pageable,
            });
            setGhostList((prev) => [...prev, ...res.content]);
        };
        fetchGhosts();
    }, [courseId, pageable]);

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="소고기마라탕" />
            <View
                style={{
                    paddingLeft: 17,
                    marginTop: 20,
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
                    <UserStatItem
                        key={item.runningId}
                        rank={index + 1}
                        name={item.runningName}
                        avatar={item.runnerProfileUrl}
                        time={getRunTime(item.duration, "MM:SS")}
                        pace={getFormattedPace(item.averagePace)}
                        cadence={item.cadence.toString() + " spm"}
                        ghostId={item.runningId.toString()}
                        isGhostSelected={selectedGhostId === item.runningId}
                        onPress={() => setSelectedGhostId(item.runningId)}
                    />
                )}
                estimatedItemSize={83}
                showsVerticalScrollIndicator={false}
                extraData={selectedGhostId}
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
