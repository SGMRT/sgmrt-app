import { ChevronIcon, EditIcon, ShareIcon } from "@/assets/svgs/svgs";
import StyledChart from "@/src/components/chart/StyledChart";
import CourseLayer from "@/src/components/map/CourseLayer";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import Header from "@/src/components/ui/Header";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatRow from "@/src/components/ui/StatRow";
import { Typography, typographyStyles } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { Course } from "@/src/types/course";
import { calculateCenter } from "@/src/utils/mapUtils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DATA = Array.from({ length: 100 }, (_, i) => ({
    distance: i * 10,
    paceLast30: 40 + 30 * Math.random(),
    altitude: 100 + 10 * Math.random(),
    time: i * 10,
}));

export default function Result() {
    const { courseId, runningId } = useLocalSearchParams();

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
    const [isEditing, setIsEditing] = useState(false);
    const titleInputRef = useRef<TextInput>(null);
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
            latitude: coordinate[1],
            longitude: coordinate[0],
        }))
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText={date} />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.titleContainer}>
                    <View style={styles.titleLeft}>
                        <TextInput
                            editable={isEditing}
                            placeholder="제목을 입력해주세요"
                            defaultValue="월요일 아침 러닝"
                            style={styles.titleInput}
                            ref={titleInputRef}
                            onBlur={() => {
                                setIsEditing(false);
                                console.log("blur");
                            }}
                        />
                        <EditIcon
                            onPress={() => {
                                setIsEditing(true);
                                titleInputRef.current?.focus();
                            }}
                        />
                    </View>
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
                    <View
                        style={{
                            height: 1,
                            width: "100%",
                            backgroundColor: "#3f3f3f",
                        }}
                    />
                    <View style={{ paddingVertical: 15, gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="body1" color="gray60">
                                페이스
                            </Typography>
                            <ChevronIcon
                                style={{ transform: [{ rotate: "-90deg" }] }}
                            />
                        </View>
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
                        <StyledChart
                            data={DATA}
                            xKey="distance"
                            yKeys={["paceLast30"]}
                        />
                    </View>
                    <View
                        style={{
                            height: 1,
                            width: "100%",
                            backgroundColor: "#3f3f3f",
                        }}
                    />
                    <View style={{ paddingVertical: 15, gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="body1" color="gray60">
                                고도
                            </Typography>
                            <ChevronIcon
                                style={{ transform: [{ rotate: "-90deg" }] }}
                            />
                        </View>
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
                        <StyledChart
                            data={DATA}
                            xKey="distance"
                            yKeys={["altitude"]}
                        />
                    </View>
                </View>
            </ScrollView>
            <SlideToDualAction
                onSlideLeft={() => {
                    router.replace("/");
                }}
                onSlideRight={() => {
                    console.log("코스 등록");
                }}
                leftLabel="메인으로"
                rightLabel="코스 등록"
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
    titleLeft: {
        flexDirection: "row",
        gap: 4,
    },
    titleInput: {
        ...typographyStyles.subhead1,
        color: colors.white,
        lineHeight: undefined,
    },
    mapContainer: {
        height: 356,
    },
});
