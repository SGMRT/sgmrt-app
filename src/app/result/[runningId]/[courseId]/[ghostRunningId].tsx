import { ShareIcon, UserIcon } from "@/assets/svgs/svgs";
import {
    getCourse,
    getRun,
    getRunComperison,
    patchCourseName,
    patchRunName,
} from "@/src/apis";
import StyledChart from "@/src/components/chart/StyledChart";
import UserStatItem from "@/src/components/map/courseInfo/UserStatItem";
import CourseLayer from "@/src/components/map/CourseLayer";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import BottomModal from "@/src/components/ui/BottomModal";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import NameInput from "@/src/components/ui/NameInput";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatRow from "@/src/components/ui/StatRow";
import { Typography } from "@/src/components/ui/Typography";
import {
    calculateCenter,
    calculateZoomLevelFromSize,
    convertTelemetriesToCourse,
} from "@/src/utils/mapUtils";
import { getDate, getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Result() {
    const { runningId, courseId, ghostRunningId } = useLocalSearchParams();
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
        setIsCourseModalOpen(true);
    };

    const {
        data: runData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["result", runningId],
        queryFn: () => getRun(Number(runningId)),
        enabled: !!runningId,
    });

    const {
        data: ghostData,
        isLoading: ghostIsLoading,
        isError: ghostIsError,
    } = useQuery({
        queryKey: ["comparison", runningId, ghostRunningId],
        queryFn: () =>
            getRunComperison(Number(runningId), Number(ghostRunningId)),
        enabled: !!ghostRunningId,
    });

    const {
        data: courseData,
        isLoading: courseIsLoading,
        isError: courseIsError,
    } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: courseId !== "-1",
    });

    console.log(runningId, courseId, ghostRunningId);
    // console.log(data, ghostData);

    const [recordTitle, setRecordTitle] = useState(runData?.runningName ?? "");
    const [courseName, setCourseName] = useState("");

    const router = useRouter();

    const center = useMemo(
        () =>
            calculateCenter(
                runData?.telemetries?.map((telemetry) => ({
                    lat: telemetry.lat,
                    lng: telemetry.lng,
                })) ?? []
            ),
        [runData?.telemetries]
    );

    const { bottom } = useSafeAreaInsets();

    if (isLoading || ghostIsLoading || courseIsLoading) {
        return <></>;
    }

    if (isError || ghostIsError || courseIsError) {
        router.replace("/");
    }

    return (
        runData && (
            <>
                <SafeAreaView style={styles.container}>
                    <Header titleText={getDate(runData.startedAt)} />
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.titleContainer}>
                            {courseId === "-1" ? (
                                <NameInput
                                    defaultValue={runData.runningName}
                                    placeholder="제목을 입력해주세요"
                                    onChangeText={setRecordTitle}
                                    onBlur={async () => {
                                        await patchRunName(
                                            Number(runningId),
                                            recordTitle,
                                            1
                                        );
                                    }}
                                />
                            ) : (
                                <View style={styles.courseNameContainer}>
                                    <Typography
                                        variant="subhead1"
                                        color="white"
                                    >
                                        {courseData?.name ??
                                            ghostData?.courseInfo.name ??
                                            "무명의 코스"}
                                    </Typography>
                                    <Divider direction="vertical" />
                                    <View style={styles.userCountContainer}>
                                        <UserIcon />
                                        <Typography
                                            variant="caption1"
                                            color="gray60"
                                        >
                                            {ghostData?.courseInfo
                                                .runnerCount ?? 452}
                                        </Typography>
                                    </View>
                                </View>
                            )}
                            <ShareIcon />
                        </View>
                        <View style={styles.mapContainer}>
                            <MapViewWrapper
                                controlEnabled={false}
                                showPuck={false}
                                center={center}
                                zoom={calculateZoomLevelFromSize(
                                    center.size,
                                    center.latitude
                                )}
                            >
                                <CourseLayer
                                    course={convertTelemetriesToCourse(
                                        runData.telemetries ?? []
                                    )}
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
                                        value: (
                                            runData.recordInfo.distance / 1000
                                        ).toFixed(2),
                                        unit: "km",
                                        description: "전체 거리",
                                    },
                                    {
                                        value: getRunTime(
                                            runData.recordInfo.duration,
                                            "MM:SS"
                                        ),
                                        unit: "",
                                        description: "시간",
                                    },
                                    {
                                        value: runData.recordInfo.cadence.toString(),
                                        unit: "spm",
                                        description: "케이던스",
                                    },
                                    {
                                        value: runData.recordInfo.calories.toString(),
                                        unit: "kcal",
                                        description: "칼로리",
                                    },
                                ]}
                            />
                            {ghostData && (
                                <>
                                    <Divider direction="horizontal" />
                                    <CollapsibleSection
                                        title="기록 비교"
                                        defaultOpen={true}
                                        alwaysVisibleChildren={
                                            <StatRow
                                                style={{
                                                    gap: 20,
                                                }}
                                                stats={[
                                                    {
                                                        value: (ghostData?.comparisonInfo.distance).toFixed(
                                                            2
                                                        ),
                                                        unit: "km",
                                                        description: "거리",
                                                    },
                                                    {
                                                        value: getRunTime(
                                                            ghostData
                                                                ?.comparisonInfo
                                                                .duration,
                                                            "MM:SS"
                                                        ),
                                                        unit: "",
                                                        description: "시간",
                                                    },
                                                    {
                                                        value: ghostData?.comparisonInfo.cadence.toString(),
                                                        unit: "spm",
                                                        description: "케이던스",
                                                    },
                                                    {
                                                        value: getFormattedPace(
                                                            ghostData
                                                                ?.comparisonInfo
                                                                .pace
                                                        ),
                                                        unit: "",
                                                        description: "페이스",
                                                    },
                                                ]}
                                            />
                                        }
                                    >
                                        <UserStatItem
                                            name={ghostData.myRunInfo.nickname}
                                            avatar={
                                                ghostData.myRunInfo.profileUrl
                                            }
                                            time={getRunTime(
                                                ghostData.myRunInfo.recordInfo
                                                    .duration,
                                                "MM:SS"
                                            )}
                                            cadence={ghostData.myRunInfo.recordInfo.cadence.toString()}
                                            isGhostSelected={true}
                                            pace={getFormattedPace(
                                                ghostData.myRunInfo.recordInfo
                                                    .averagePace
                                            )}
                                            paddingHorizontal={false}
                                            backgroundColor={false}
                                            isMyRecord={true}
                                        />
                                        <UserStatItem
                                            name={
                                                ghostData.ghostRunInfo.nickname
                                            }
                                            avatar={
                                                ghostData.ghostRunInfo
                                                    .profileUrl
                                            }
                                            time={getRunTime(
                                                ghostData.ghostRunInfo
                                                    .recordInfo.duration,
                                                "MM:SS"
                                            )}
                                            cadence={ghostData.ghostRunInfo.recordInfo.cadence.toString()}
                                            isGhostSelected={false}
                                            pace={getFormattedPace(
                                                ghostData.ghostRunInfo
                                                    .recordInfo.averagePace
                                            )}
                                            backgroundColor={false}
                                            paddingHorizontal={false}
                                            isMyRecord={false}
                                        />
                                    </CollapsibleSection>
                                </>
                            )}
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
                                                value: getFormattedPace(
                                                    runData.recordInfo
                                                        .averagePace
                                                ),
                                                unit: "",
                                                description: "평균",
                                            },
                                            {
                                                value: getFormattedPace(
                                                    runData.recordInfo
                                                        .lowestPace
                                                ),
                                                unit: "",
                                                description: "최고",
                                            },
                                            {
                                                value: getFormattedPace(
                                                    runData.recordInfo
                                                        .highestPace
                                                ),
                                                unit: "",
                                                description: "최저",
                                            },
                                        ]}
                                    />
                                }
                            >
                                <StyledChart
                                    data={runData.telemetries}
                                    xKey="dist"
                                    yKeys={["pace"]}
                                    invertYAxis={true}
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
                                                value: runData.recordInfo.totalElevation.toString(),
                                                unit: "m",
                                                description: "평균",
                                            },
                                            {
                                                value: runData.recordInfo.elevationGain.toString(),
                                                unit: "m",
                                                description: "상승",
                                            },
                                            {
                                                value: runData.recordInfo.elevationLoss.toString(),
                                                unit: "m",
                                                description: "하강",
                                            },
                                        ]}
                                    />
                                }
                            >
                                <StyledChart
                                    data={runData.telemetries}
                                    xKey="dist"
                                    yKeys={["alt"]}
                                />
                            </CollapsibleSection>
                            <Divider direction="horizontal" />
                        </View>
                    </ScrollView>
                    {courseId === "-1" ? (
                        <SlideToDualAction
                            onSlideLeft={() => {
                                router.replace("/");
                            }}
                            onSlideRight={async () => {
                                if (isCourseModalOpen) {
                                    if (runData.courseInfo === null) {
                                        console.log("NO COURSE");
                                        Toast.show({
                                            type: "info",
                                            text1: "코스 정보를 찾을 수 없습니다",
                                            position: "bottom",
                                        });
                                        router.replace("/");
                                        return;
                                    }
                                    await patchCourseName(
                                        runData.courseInfo.id,
                                        courseName,
                                        true
                                    )
                                        .then(() => {
                                            Toast.show({
                                                type: "success",
                                                text1: "코스가 등록 되었습니다",
                                                position: "bottom",
                                            });
                                        })
                                        .catch((error) => {
                                            Toast.show({
                                                type: "info",
                                                text1: "코스 등록에 실패했습니다",
                                                position: "bottom",
                                            });
                                        })
                                        .finally(() => {
                                            router.replace("/");
                                        });
                                } else {
                                    handlePresentModalPress();
                                }
                            }}
                            leftLabel="메인으로"
                            rightLabel="코스 등록"
                        />
                    ) : (
                        <SlideToAction
                            onSlideSuccess={() => {
                                router.replace("/");
                            }}
                            label="메인으로"
                            color="green"
                            direction="left"
                        />
                    )}
                </SafeAreaView>
                <BottomModal
                    bottomSheetRef={bottomSheetRef}
                    bottomInset={bottom + 56}
                    canClose={true}
                    handleStyle={styles.handle}
                    onDismiss={() => {
                        setIsCourseModalOpen(false);
                    }}
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
        )
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
    userCountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    courseNameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
