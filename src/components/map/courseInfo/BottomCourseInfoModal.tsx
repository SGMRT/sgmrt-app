import { ChevronRight } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Divider } from "../../ui/Divider";
import SlideToAction from "../../ui/SlideToAction";
import StatsIndicator from "../../ui/StatsIndicator";
import { Typography } from "../../ui/Typography";
import UserWithRank from "./UserWithRank";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
    heightVal: SharedValue<number>;
}

const stats = [
    { label: "전체 거리", value: "1.45", unit: "km" },
    { label: "고도 상승", value: "+18", unit: "m" },
    { label: "고도 하강", value: "-24", unit: "m" },
    { label: "평균 시간", value: "24:21", unit: "" },
    { label: "평균 페이스", value: "8’15”", unit: "" },
    { label: "평균 케이던스", value: "24", unit: "spm" },
];

const ghostList = [
    {
        id: "1",
        name: "윤다희",
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
        name: "이진",
        avatar: "https://picsum.photos/200/300",
        time: "25:12",
        pace: "8’23”",
        cadence: "124spm",
    },
];

export default function BottomCourseInfoModal({
    bottomSheetRef,
    canClose = true,
    heightVal,
}: BottomCourseInfoModalProps) {
    const [tab, setTab] = useState<"course" | "ghost">("course");
    const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
        ghostList[0].id
    );
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            bottomInset={bottom}
            enablePanDownToClose={canClose}
            backgroundStyle={styles.container}
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
            animatedPosition={heightVal}
        >
            <BottomSheetView>
                <View style={styles.tabContainer}>
                    <Pressable
                        onPress={() => setTab("course")}
                        style={styles.tab}
                    >
                        <Typography
                            variant="subhead2"
                            color={tab === "course" ? "white" : "gray60"}
                        >
                            코스 상세 정보
                        </Typography>
                    </Pressable>
                    <Divider />
                    <Pressable
                        onPress={() => setTab("ghost")}
                        style={styles.tab}
                    >
                        <Typography
                            variant="subhead2"
                            color={tab === "ghost" ? "white" : "gray60"}
                        >
                            고스트 선택
                        </Typography>
                    </Pressable>
                </View>
                <View style={{ marginBottom: 30 }}>
                    {tab === "course" && <StatsIndicator stats={stats} />}
                </View>
                {tab === "ghost" && (
                    <View style={{ gap: 10 }}>
                        <View style={styles.ghostListContainer}>
                            <Typography variant="body1" color="gray40">
                                빠른 완주 순위
                            </Typography>
                            <View style={styles.ghostListContainerText}>
                                <Pressable
                                    onPress={() => {
                                        bottomSheetRef.current?.dismiss();
                                        router.push("/course/123");
                                    }}
                                >
                                    <Typography variant="body2" color="gray60">
                                        전체 보기
                                    </Typography>
                                </Pressable>
                                <ChevronRight />
                            </View>
                        </View>
                        <View style={styles.marginBottom}>
                            {ghostList.slice(0, 3).map((ghost, index) => (
                                <UserWithRank
                                    key={ghost.id}
                                    rank={index + 1}
                                    name={ghost.name}
                                    avatar={ghost.avatar}
                                    time={ghost.time}
                                    pace={ghost.pace}
                                    cadence={ghost.cadence}
                                    ghostId={ghost.id}
                                    isGhostSelected={
                                        selectedGhostId === ghost.id
                                    }
                                    onPress={() => {
                                        setSelectedGhostId(ghost.id);
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                )}
                <SlideToAction
                    label={
                        tab === "course"
                            ? "이 코스로 러닝 시작"
                            : "고스트와 러닝 시작"
                    }
                    onSlideSuccess={() => {
                        console.log("slide success");
                    }}
                    color="green"
                    direction="left"
                />
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 0,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    tab: {
        flex: 1,
        alignItems: "center",
    },
    courseInfoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 20,
        marginBottom: 30,
    },
    courseInfoItem: {
        width: "33%",
        alignItems: "center",
    },
    courseInfoItemValue: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    ghostListContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 17,
    },
    ghostListContainerText: {
        flexDirection: "row",
        alignItems: "center",
    },
    marginBottom: {
        marginBottom: 20,
    },
});
