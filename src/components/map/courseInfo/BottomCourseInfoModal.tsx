import { ChevronRight } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Divider } from "../../ui/Divider";
import { Typography } from "../../ui/Typography";
import SlideToAction from "../SlideToAction";
import UserWithRank from "./UserWithRank";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
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
}: BottomCourseInfoModalProps) {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState<"course" | "ghost">("course");
    const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
        ghostList[0].id
    );
    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            bottomInset={insets.bottom}
            enablePanDownToClose
            backgroundStyle={{
                backgroundColor: "#111111",
                borderRadius: 0,
            }}
            handleStyle={{
                paddingTop: 10,
                paddingBottom: 20,
            }}
            handleIndicatorStyle={{
                backgroundColor: colors.gray[40],
                width: 50,
                height: 5,
                borderRadius: 100,
            }}
        >
            <BottomSheetView>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 30,
                    }}
                >
                    <Pressable
                        onPress={() => setTab("course")}
                        style={{
                            flex: 1,
                            alignItems: "center",
                        }}
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
                        style={{
                            alignItems: "center",
                            flex: 1,
                        }}
                    >
                        <Typography
                            variant="subhead2"
                            color={tab === "ghost" ? "white" : "gray60"}
                        >
                            고스트 선택
                        </Typography>
                    </Pressable>
                </View>
                {tab === "course" && (
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            rowGap: 20,
                            marginBottom: 30,
                        }}
                    >
                        {stats.map((stat) => (
                            <View
                                key={stat.label}
                                style={{
                                    width: "33%",
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <Typography
                                        variant="display1"
                                        color="gray40"
                                    >
                                        {stat.value}
                                    </Typography>
                                    <Typography
                                        variant="display2"
                                        color="gray40"
                                    >
                                        {stat.unit}
                                    </Typography>
                                </View>

                                <Typography variant="body1" color="gray60">
                                    {stat.label}
                                </Typography>
                            </View>
                        ))}
                    </View>
                )}
                {tab === "ghost" && (
                    <View style={{ gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingHorizontal: 17,
                            }}
                        >
                            <Typography variant="body1" color="gray40">
                                빠른 완주 순위
                            </Typography>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Typography variant="body2" color="gray60">
                                    전체 보기
                                </Typography>
                                <ChevronRight />
                            </View>
                        </View>
                        <View
                            style={{
                                marginBottom: 20,
                            }}
                        >
                            {ghostList.map((ghost, index) => (
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
                                    onPress={() => setSelectedGhostId(ghost.id)}
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
