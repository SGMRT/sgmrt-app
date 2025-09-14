import { ChevronIcon, InfoIcon } from "@/assets/svgs/svgs";
import { getCourse } from "@/src/apis";
import { CourseDetailResponse } from "@/src/apis/types/course";
import StyledChart from "@/src/components/chart/StyledChart";
import { GhostRow } from "@/src/components/map/courseInfo/GhostRow";
import ResultCorseMap from "@/src/components/result/ResultCourseMap";
import RunShot, { RunShotHandle } from "@/src/components/shot/RunShot";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import ScrollButton from "@/src/components/ui/ScrollButton";
import Section from "@/src/components/ui/Section";
import ShareButton from "@/src/components/ui/ShareButton";
import StatRow from "@/src/components/ui/StatRow";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { UserCount } from "@/src/components/ui/UserCount";
import colors from "@/src/theme/colors";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Result() {
    const { courseId } = useLocalSearchParams();

    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();

    const isChartActive = useSharedValue(false);
    const chartPointIndex = useSharedValue(0);

    const { data: course } = useQuery<CourseDetailResponse>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: courseId !== "-1",
    });

    const courseAverageStats = useMemo(() => {
        return [
            {
                description: "전체 거리",
                value: ((course?.distance ?? 0) / 1000).toFixed(2),
                unit: "km",
            },
            {
                description: "고도",
                value: Math.round(course?.elevationAverage ?? 0).toString(),
                unit: "m",
            },
            {
                description: "상승",
                value: Math.round(course?.elevationGain ?? 0).toString(),
                unit: "m",
            },
            {
                description: "하강",
                value: Math.round(course?.elevationLoss ?? 0).toString(),
                unit: "m",
            },
        ];
    }, [course]);

    const runShotRef = useRef<RunShotHandle>(null);

    const captureMap = useCallback(async () => {
        try {
            const uri = await runShotRef.current?.capture?.();

            if (!uri) return null;

            const safeName = (course?.name ?? "run").replace(/\s+/g, "_");
            const filename = `${safeName}.jpg`;
            const targetPath = `${FileSystem.cacheDirectory}/${filename}`;

            await FileSystem.copyAsync({
                from: uri,
                to: targetPath,
            });

            return targetPath;
        } catch (error) {
            console.log("captureMap error: ", error);
            return null;
        }
    }, [course?.name]);

    return (
        course && (
            <>
                <SafeAreaView style={styles.container}>
                    <Header
                        titleText={getDate(course?.createdAt ?? 0)}
                        onBack={() =>
                            router.replace({
                                pathname: "/(tabs)/profile",
                                params: {
                                    tab: "course",
                                },
                            })
                        }
                    />
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* 제목 파트 */}
                        <View style={styles.titleContainer}>
                            <View style={styles.titleInputContainer}>
                                <Typography variant="subhead3" color="white">
                                    {course?.name}
                                </Typography>
                                <Divider />
                                <UserCount
                                    userCount={course?.totalRunsCount ?? 0}
                                />
                            </View>
                            <ShareButton
                                title={course?.name}
                                message={getDate(course?.createdAt ?? 0).trim()}
                                filename={course?.name + ".jpg"}
                                getUri={captureMap}
                            />
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
                                telemetries={course?.telemetries ?? []}
                                isChartActive={isChartActive}
                                chartPointIndex={chartPointIndex}
                                yKey="alt"
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
                            title="코스 정보"
                            titleColor="white"
                            titleVariant="sectionhead"
                            style={{ gap: 15 }}
                        >
                            <StatRow
                                color="gray20"
                                style={{ gap: 20 }}
                                stats={courseAverageStats}
                            />
                            <StyledChart
                                label={"고도"}
                                data={course?.telemetries ?? []}
                                xKey="dist"
                                yKeys={["alt"]}
                                showToolTip={true}
                                onPointChange={(payload) => {
                                    isChartActive.value = payload.isActive;
                                    chartPointIndex.value = payload.index;
                                }}
                                expandable
                            />
                        </Section>

                        {/* 고스트 */}
                        <Section
                            title="내 고스트"
                            titleColor="white"
                            titleVariant="sectionhead"
                            titleRightChildren={
                                <TouchableOpacity
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <Typography
                                        variant="caption1"
                                        color="gray40"
                                    >
                                        고스트
                                    </Typography>
                                    <InfoIcon />
                                </TouchableOpacity>
                            }
                        >
                            <GhostRow
                                profileUrl={
                                    course?.myGhostInfo?.runnerProfileUrl ?? ""
                                }
                                ghostStats={[
                                    {
                                        description: "시간",
                                        value: getRunTime(
                                            course?.myGhostInfo?.duration ?? 0,
                                            "HH:MM:SS"
                                        ),
                                    },
                                    {
                                        description: "페이스",
                                        value: getFormattedPace(
                                            course?.myGhostInfo?.averagePace ??
                                                0
                                        ),
                                    },
                                    {
                                        description: "케이던스",
                                        value:
                                            course?.myGhostInfo?.cadence ?? 0,
                                        unit: "spm",
                                    },
                                ]}
                            />
                        </Section>
                    </ScrollView>
                    <ScrollButton
                        onPress={() => {
                            scrollViewRef.current?.scrollTo({
                                y: 0,
                                animated: true,
                            });
                        }}
                        bottomInset={5}
                    />
                    <TabBar />
                </SafeAreaView>
                <RunShot
                    ref={runShotRef}
                    fileName={course?.name + ".jpg"}
                    telemetries={course?.telemetries ?? []}
                    type="share"
                    title={course?.name}
                    distance={((course?.distance ?? 0) / 1000).toFixed(2)}
                    stats={courseAverageStats}
                />
            </>
        )
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        paddingBottom: 45,
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
        paddingBottom: 20,
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
