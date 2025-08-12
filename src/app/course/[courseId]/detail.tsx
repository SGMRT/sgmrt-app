import { ChevronIcon, ShareIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getCourseTopRanking,
    getRunTelemetriesByCourseId,
} from "@/src/apis";
import { CourseDetailResponse, HistoryResponse } from "@/src/apis/types/course";
import { GhostInfoSection } from "@/src/components/map/courseInfo/BottomCourseInfoModal";
import ResultCorseMap from "@/src/components/result/ResultCorseMap";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import ScrollButton from "@/src/components/ui/ScrollButton";
import Section from "@/src/components/ui/Section";
import SlideToAction from "@/src/components/ui/SlideToAction";
import StatRow from "@/src/components/ui/StatRow";
import { Typography } from "@/src/components/ui/Typography";
import { UserCount } from "@/src/components/ui/UserCount";
import colors from "@/src/theme/colors";
import { calculateCenter, Coordinate } from "@/src/utils/mapUtils";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Result() {
    const { courseId } = useLocalSearchParams();

    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();

    const { data: ghostList } = useQuery<HistoryResponse[]>({
        queryKey: ["course-top-ranking", courseId],
        queryFn: () =>
            getCourseTopRanking({ courseId: Number(courseId), count: 3 }),
        enabled: courseId !== "-1",
    });

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: courseId !== "-1",
    });

    const { data: courseTelemetries } = useQuery<{
        name: string;
        coordinates: Coordinate[];
    }>({
        queryKey: ["courseTelemetries", courseId],
        queryFn: () => getRunTelemetriesByCourseId(Number(courseId)),
        enabled: courseId !== "-1",
    });

    const center = useMemo(
        () => calculateCenter(courseTelemetries?.coordinates ?? []),
        [courseTelemetries?.coordinates]
    );

    const courseAverageStats = useMemo(() => {
        return [
            {
                description: "전체 거리",
                value: ((course?.distance ?? 0) / 1000).toFixed(2),
                unit: "km",
            },
            {
                description: "고도",
                value:
                    (course?.elevationGain ?? 0) + (course?.elevationLoss ?? 0),
                unit: "m",
            },
            {
                description: "상승",
                value: course?.elevationGain ?? 0,
                unit: "m",
            },
            {
                description: "하강",
                value: course?.elevationLoss ?? 0,
                unit: "m",
            },
        ];
    }, [course]);

    return (
        courseTelemetries && (
            <SafeAreaView style={styles.container}>
                <Header titleText={"코스 생성 시간 가져와야함"} />
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* 제목 파트 */}
                    <View style={styles.titleContainer}>
                        <View style={styles.titleInputContainer}>
                            <Typography variant="subhead3" color="white">
                                {courseTelemetries.name}
                            </Typography>
                            <Divider />
                            <UserCount userCount={-1} />
                        </View>
                        <Pressable
                            onPress={() => {
                                Toast.show({
                                    type: "info",
                                    text1: "해당 기능은 준비 중입니다",
                                    position: "bottom",
                                });
                            }}
                        >
                            <ShareIcon style={styles.shareButton} />
                        </Pressable>
                    </View>

                    {/* 코스 지도 파트 */}
                    <View
                        style={{
                            borderRadius: 20,
                            alignItems: "center",
                            backgroundColor: "#171717",
                        }}
                    >
                        <ResultCorseMap
                            center={center}
                            telemetries={courseTelemetries.coordinates.map(
                                (coordinate) => ({
                                    timeStamp: 0,
                                    lat: coordinate.lat,
                                    lng: coordinate.lng,
                                    dist: 0,
                                    pace: 0,
                                    alt: 0,
                                    cadence: 0,
                                    bpm: 0,
                                    isRunning: true,
                                })
                            )}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                router.replace(`/stats`);
                            }}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginVertical: 12,
                            }}
                        >
                            <Typography variant="body2" color="gray40">
                                내 기록 보기
                            </Typography>
                            <ChevronIcon color={colors.gray[40]} />
                        </TouchableOpacity>
                    </View>

                    {/* 내 페이스 및 코스 정보 파트 */}
                    <Section
                        title="내 페이스"
                        titleColor="white"
                        style={{ gap: 15 }}
                    >
                        <StatRow
                            color="gray20"
                            style={{ gap: 20 }}
                            stats={courseAverageStats}
                        />
                        <Typography variant="subhead3" color="white">
                            고도 시계열 필요
                        </Typography>
                        {/* <StyledChart
                                label={"고도"}
                                data={courseTelemetries?.coordinates ?? []}
                                xKey="dist"
                                yKeys={"alt"}
                                invertYAxis={true}
                                expandable
                            /> */}
                    </Section>

                    <GhostInfoSection
                        stats={courseAverageStats}
                        uuid={null}
                        ghostList={ghostList ?? []}
                        selectedGhostId={0}
                        setSelectedGhostId={() => {}}
                        onPress={() => {}}
                        hasMargin={false}
                        color="white"
                    />
                </ScrollView>
                <SlideToAction
                    label="이 코스로 러닝 시작"
                    onSlideSuccess={() => {
                        router.replace(`/run/${courseId}/-1`);
                    }}
                    color="green"
                    direction="left"
                />
                <ScrollButton
                    onPress={() => {
                        scrollViewRef.current?.scrollTo({
                            y: 0,
                            animated: true,
                        });
                    }}
                    bottomInset={66}
                />
            </SafeAreaView>
        )
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    titleInputContainer: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1,
        maxWidth: "50%",
    },
    content: {
        backgroundColor: "#111111",
        marginHorizontal: 16.5,
        marginTop: 20,
        gap: 20,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
    shareButton: {
        marginLeft: 8,
        flex: 1,
    },
});
