import { ShareIcon } from "@/assets/svgs/svgs";
import StyledChart from "@/src/components/chart/StyledChart";
import CourseLayer from "@/src/components/map/CourseLayer";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import BottomModal from "@/src/components/ui/BottomModal";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import NameInput from "@/src/components/ui/NameInput";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatRow from "@/src/components/ui/StatRow";
import { Typography } from "@/src/components/ui/Typography";
import { Course } from "@/src/types/course";
import { calculateCenter } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

const DATA = Array.from({ length: 100 }, (_, i) => ({
    distance: i * 10,
    paceLast30: 40 + 30 * Math.random(),
    altitude: 100 + 10 * Math.random(),
    time: i * 10,
}));

export default function Result() {
    const { runningId, ghostRunningId } = useLocalSearchParams();

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };

    const [recordTitle, setRecordTitle] = useState("월요일 아침 러닝");
    const [courseName, setCourseName] = useState("");

    //2025.06.24
    const date = new Date()
        .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "numeric",
        })
        .slice(0, 12)
        .split(". ")
        .join(".");
    const router = useRouter();
    const course = {
        id: 1,
        name: "월요일 아침 러닝",
        coordinates: [
            [126.85, 37.48],
            [126.86, 37.49],
        ],
    } as Course;

    const center = calculateCenter(
        course.coordinates.map((coordinate) => ({
            lat: coordinate[1],
            lng: coordinate[0],
        }))
    );

    const { bottom } = useSafeAreaInsets();

    return (
        <>
            <SafeAreaView style={styles.container}>
                <Header titleText={date} />
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.titleContainer}>
                        <NameInput
                            defaultValue="월요일 아침 러닝"
                            placeholder="제목을 입력해주세요"
                            onChangeText={setRecordTitle}
                        />
                        <ShareIcon />
                    </View>
                    <View style={styles.mapContainer}>
                        <MapViewWrapper
                            controlEnabled={false}
                            showPuck={false}
                            center={center}
                            zoom={14}
                        >
                            <CourseLayer
                                course={course}
                                isActive={true}
                                onClickCourse={() => {}}
                            />
                        </MapViewWrapper>
                    </View>
                    <View
                        style={{
                            paddingHorizontal: 17,
                        }}
                    >
                        <StatRow
                            style={{
                                paddingVertical: 20,
                                justifyContent: "space-between",
                            }}
                            stats={[
                                {
                                    value: "1.45",
                                    unit: "km",
                                    description: "전체 거리",
                                },
                                {
                                    value: "25:45",
                                    unit: "",
                                    description: "시간",
                                },
                                {
                                    value: "150",
                                    unit: "spm",
                                    description: "케이던스",
                                },
                                {
                                    value: "90",
                                    unit: "kcal",
                                    description: "칼로리",
                                },
                            ]}
                        />
                        <Divider direction="horizontal" />
                        <CollapsibleSection
                            title="페이스"
                            defaultOpen={true}
                            alwaysVisibleChildren={
                                <StatRow
                                    style={{
                                        gap: 20,
                                    }}
                                    stats={[
                                        {
                                            value: "8'23''",
                                            unit: "",
                                            description: "평균",
                                        },
                                        {
                                            value: "10'23''",
                                            unit: "",
                                            description: "최고",
                                        },
                                        {
                                            value: "10'23''",
                                            unit: "",
                                            description: "최저",
                                        },
                                    ]}
                                />
                            }
                        >
                            <StyledChart
                                data={DATA}
                                xKey="distance"
                                yKeys={["paceLast30"]}
                            />
                        </CollapsibleSection>
                        <Divider direction="horizontal" />
                        <CollapsibleSection
                            title="고도"
                            defaultOpen={true}
                            alwaysVisibleChildren={
                                <StatRow
                                    style={{
                                        gap: 20,
                                    }}
                                    stats={[
                                        {
                                            value: "17",
                                            unit: "m",
                                            description: "평균",
                                        },
                                        {
                                            value: "+18",
                                            unit: "m",
                                            description: "상승",
                                        },
                                        {
                                            value: "-13",
                                            unit: "m",
                                            description: "하강",
                                        },
                                    ]}
                                />
                            }
                        >
                            <StyledChart
                                data={DATA}
                                xKey="distance"
                                yKeys={["altitude"]}
                            />
                        </CollapsibleSection>
                        <Divider direction="horizontal" />
                    </View>
                </ScrollView>
                <SlideToDualAction
                    onSlideLeft={() => {
                        router.replace("/");
                    }}
                    onSlideRight={() => {
                        console.log(courseName);
                        handlePresentModalPress();
                    }}
                    leftLabel="메인으로"
                    rightLabel="코스 등록"
                />
            </SafeAreaView>
            <BottomModal
                bottomSheetRef={bottomSheetRef}
                bottomInset={bottom + 56}
                canClose={true}
                handleStyle={styles.handle}
            >
                <View style={styles.bottomSheetContent}>
                    <NameInput
                        placeholder="코스명을 입력해주세요"
                        onChangeText={setCourseName}
                    />
                    <Typography variant="body2" color="gray40">
                        코스를 한 번 등록하면 삭제 및 수정이 어렵습니다
                    </Typography>
                </View>
            </BottomModal>
        </>
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
        height: 50,
    },
    content: {
        backgroundColor: "#171717",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        paddingVertical: 20,
    },
    mapContainer: {
        height: 356,
    },
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
    bottomSheetContent: {
        paddingVertical: 30,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 0,
    },
});
