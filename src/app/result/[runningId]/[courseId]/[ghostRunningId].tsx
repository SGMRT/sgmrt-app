import { ShareIcon } from "@/assets/svgs/svgs";
import {
    getCourseTopRanking,
    getRun,
    getRunComperison,
    patchRunName,
} from "@/src/apis";
import { HistoryResponse } from "@/src/apis/types/course";
import StyledChart from "@/src/components/chart/StyledChart";
import ResultCorseMap from "@/src/components/result/ResultCorseMap";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import NameInput from "@/src/components/ui/NameInput";
import Section from "@/src/components/ui/Section";
import StatRow from "@/src/components/ui/StatRow";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { calculateCenter } from "@/src/utils/mapUtils";
import { getDate, getFormattedPace } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

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
        enabled: !!ghostRunningId && ghostRunningId !== "-1",
    });

    const { data: ghostList } = useQuery<HistoryResponse[]>({
        queryKey: ["course-top-ranking", courseId],
        queryFn: () =>
            getCourseTopRanking({ courseId: Number(courseId), count: 3 }),
        enabled: !!courseId && courseId !== "-1",
    });

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

    if (isLoading || ghostIsLoading) {
        return <></>;
    }

    if (isError || ghostIsError) {
        router.replace("/");
    }

    return (
        runData && (
            <>
                <SafeAreaView style={styles.container}>
                    <Header
                        titleText={getDate(runData.startedAt)}
                        // onDelete={() => {
                        //     deleteRun(Number(runningId)).then(() => {
                        //         router.replace("/");
                        //         Toast.show({
                        //             type: "success",
                        //             text1: "기록이 삭제되었습니다",
                        //             position: "bottom",
                        //         });
                        //     });
                        // }}
                    />
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* 제목 파트 */}
                        <View style={styles.titleContainer}>
                            <View style={styles.titleInputContainer}>
                                <NameInput
                                    defaultValue={runData.runningName}
                                    placeholder="제목을 입력해주세요"
                                    onChangeText={setRecordTitle}
                                    onBlur={async () => {
                                        await patchRunName(
                                            Number(runningId),
                                            recordTitle
                                        );
                                    }}
                                />
                            </View>
                            <ShareIcon style={styles.shareButton} />
                        </View>

                        {/* 코스 지도 파트 */}
                        <ResultCorseMap
                            center={center}
                            telemetries={runData.telemetries ?? []}
                        />

                        {/* 내 페이스 및 코스 정보 파트 */}
                        <Section
                            title="내 페이스"
                            titleColor="white"
                            titleRightChildren={
                                <StyledButton
                                    title="페이스 수정"
                                    onPress={handlePresentModalPress}
                                    style={{ paddingHorizontal: 12 }}
                                />
                            }
                            style={{ gap: 15 }}
                        >
                            <StatRow
                                color="gray20"
                                style={{ gap: 20 }}
                                stats={[
                                    {
                                        description: "평균",
                                        value: getFormattedPace(
                                            runData.recordInfo.averagePace
                                        ),
                                    },
                                    {
                                        description: "순간 최고",
                                        value: getFormattedPace(
                                            runData.recordInfo.lowestPace
                                        ),
                                    },
                                    {
                                        description: "순간 최저",
                                        value: getFormattedPace(
                                            runData.recordInfo.highestPace
                                        ),
                                    },
                                ]}
                            />
                            <StyledChart
                                label="페이스"
                                data={runData.telemetries}
                                xKey="dist"
                                yKeys={["pace"]}
                                invertYAxis={true}
                                expandable
                            />
                        </Section>
                    </ScrollView>
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
                        <Typography variant="body3" color="gray40">
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
    titleInputContainer: {
        flexDirection: "row",
        gap: 4,
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
