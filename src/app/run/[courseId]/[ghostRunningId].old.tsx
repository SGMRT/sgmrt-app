// import { getCourse, getRun } from "@/src/apis";
// import { Telemetry } from "@/src/apis/types/run";
// import MapViewWrapper from "@/src/components/map/MapViewWrapper";
// import RunningLine, { Segment } from "@/src/components/map/RunningLine";
// import WeatherInfo from "@/src/components/map/WeatherInfo";
// import RunShot, { RunShotHandle } from "@/src/components/shot/RunShot";
// import Countdown from "@/src/components/ui/Countdown";
// import { Divider } from "@/src/components/ui/Divider";
// import EmptyListView from "@/src/components/ui/EmptyListView";
// import LoadingLayer from "@/src/components/ui/LoadingLayer";
// import SlideToAction from "@/src/components/ui/SlideToAction";
// import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
// import StatsIndicator from "@/src/components/ui/StatsIndicator";
// import TopBlurView from "@/src/components/ui/TopBlurView";
// import { Typography } from "@/src/components/ui/Typography";
// import useRunningSession from "@/src/hooks/useRunningSession";
// import colors from "@/src/theme/colors";
// import { RunnningStatus } from "@/src/types/run";
// import {
//     findClosest,
//     interpolateTelemetries,
// } from "@/src/utils/interpolateTelemetries";
// import {
//     getFormattedPace,
//     getRunTime,
//     getTelemetriesWithoutLastFalse,
//     saveRunning,
//     telemetriesToSegment,
// } from "@/src/utils/runUtils";
// import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
// import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useCallback, useEffect, useRef, useState } from "react";
// import {
//     Alert,
//     BackHandler,
//     Dimensions,
//     StyleSheet,
//     Text,
//     View,
// } from "react-native";
// import { ConfettiMethods, PIConfetti } from "react-native-fast-confetti";
// import Animated, {
//     FadeIn,
//     useAnimatedStyle,
//     useSharedValue,
// } from "react-native-reanimated";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";

// export default function CourseRun() {
//     const { bottom } = useSafeAreaInsets();
//     const router = useRouter();
//     const { courseId, ghostRunningId } = useLocalSearchParams();
//     const [isRestarting, setIsRestarting] = useState<boolean>(false);
//     const [isFirst, setIsFirst] = useState<boolean>(true);

//     const [mode, setMode] = useState<"COURSE" | "GHOST">("COURSE");

//     const [courseName, setCourseName] = useState<string>("");
//     const [courseTelemetries, setCourseTelemetries] = useState<Telemetry[]>([]);
//     const ghostTelemetries = useRef<Telemetry[]>([]);
//     const [courseSegment, setCourseSegment] = useState<Segment>();
//     const [ghostSegments, setGhostSegments] = useState<Segment[]>([]);
//     const [ghostCurrentPosition, setGhostCurrentPosition] = useState<{
//         lng: number;
//         lat: number;
//     }>({ lng: 0, lat: 0 });
//     const confettiRef = useRef<ConfettiMethods | null>(null);

//     const [isSaving, setIsSaving] = useState<boolean>(false);
//     const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
//     const runShotRef = useRef<RunShotHandle>(null);
//     const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

//     const {
//         currentRunType,
//         runSegments,
//         runTelemetries,
//         updateRunStatus,
//         runStatus,
//         runTime,
//         runUserDashboardData,
//         courseIndex,
//         updateRunType,
//         rawRunData,
//     } = useRunningSession({
//         course: courseTelemetries ?? [],
//         type: "COURSE",
//     });

//     // 코스와 고스트 러닝 데이터 가져오기
//     useEffect(() => {
//         Promise.all([
//             getCourse(Number(courseId)),
//             getRun(Number(ghostRunningId)),
//         ])
//             .then(([course, ghostRunning]) => {
//                 setCourseName(course.name);
//                 setCourseTelemetries(course.telemetries);
//                 setCourseSegment(
//                     telemetriesToSegment(course.telemetries, 0)[1]
//                 );

//                 if (ghostRunningId === "-1" || !ghostRunning) {
//                     setMode("COURSE");
//                 } else {
//                     setMode("GHOST");
//                     ghostTelemetries.current = interpolateTelemetries(
//                         ghostRunning.telemetries,
//                         250
//                     );
//                 }
//             })
//             .catch((error) => {
//                 Alert.alert(
//                     "데이터 로딩 오류",
//                     "러닝 데이터를 불러오는데 실패했습니다",
//                     [
//                         {
//                             text: "확인",
//                             onPress: () => {
//                                 router.back();
//                             },
//                         },
//                     ]
//                 );
//             });
//     }, [courseId, ghostRunningId, router]);

//     const onCompleteRestart = async (runStatus: RunnningStatus) => {
//         if (isRestarting) {
//             setIsRestarting(false);
//             if (
//                 runStatus === "stop_running" ||
//                 runStatus === "pause_running" ||
//                 runStatus === "complete_course_running"
//             ) {
//                 Toast.show({
//                     type: "success",
//                     text1: "러닝을 이어서 진행합니다",
//                     position: "bottom",
//                     bottomOffset: 60,
//                     visibilityTime: 3000,
//                 });
//             }
//             await updateRunStatus("start_running");
//             setIsFirst(false);
//         }
//     };

//     // 뒤로가기 버튼 비활성화
//     useEffect(() => {
//         const backHandler = BackHandler.addEventListener(
//             "hardwareBackPress",
//             () => {
//                 return false;
//             }
//         );

//         return () => backHandler.remove();
//     }, []);

//     useEffect(() => {
//         if (isRestarting) {
//             Toast.show({
//                 type: "info",
//                 text1: "3초 뒤 러닝이 시작됩니다.",
//                 position: "bottom",
//                 bottomOffset: 60,
//                 visibilityTime: 3000,
//             });
//         }
//     }, [isRestarting]);

//     useEffect(() => {
//         if (runStatus === "ready_course_running") {
//             setIsRestarting(true);
//         }

//         if (runStatus === "complete_course_running") {
//             confettiRef.current?.restart();
//         }
//     }, [runStatus]);

//     useEffect(() => {
//         if (
//             mode !== "GHOST" ||
//             currentRunType !== "COURSE" ||
//             runStatus !== "start_running" ||
//             ghostTelemetries.current.length <= 1
//         )
//             return;

//         const ghostTelemetry = findClosest(
//             ghostTelemetries.current,
//             runTime * 1000,
//             (r) => r.timeStamp
//         );

//         if (!ghostTelemetry) return;

//         ghostTelemetries.current = ghostTelemetries.current.filter((t) => {
//             return t.timeStamp >= ghostTelemetry.timeStamp;
//         });

//         setGhostSegments((prev) => {
//             // 마지막 points
//             const lastPoints = prev.length > 0 ? prev.at(-1)!.points : [];
//             // 마지막 위치와 다를 때만 push
//             const lastPoint = lastPoints.at(-1);
//             const isNewPoint =
//                 !lastPoint ||
//                 lastPoint.latitude !== ghostTelemetry.lat ||
//                 lastPoint.longitude !== ghostTelemetry.lng;

//             if (!isNewPoint) return prev;

//             // 새 배열/객체로 복사 (불변성 유지)
//             const newSegments = prev.length
//                 ? [
//                       ...prev.slice(0, -1),
//                       {
//                           ...prev.at(-1)!,
//                           points: [
//                               ...lastPoints,
//                               {
//                                   latitude: ghostTelemetry.lat,
//                                   longitude: ghostTelemetry.lng,
//                               },
//                           ],
//                       },
//                   ]
//                 : [
//                       {
//                           isRunning: true,
//                           points: [
//                               {
//                                   latitude: ghostTelemetry.lat,
//                                   longitude: ghostTelemetry.lng,
//                               },
//                           ],
//                       },
//                   ];
//             return newSegments;
//         });
//     }, [runTime, runStatus, currentRunType, mode]);

//     useEffect(() => {
//         if (
//             mode !== "GHOST" ||
//             currentRunType !== "COURSE" ||
//             runStatus !== "start_running"
//         )
//             return;

//         const currentGhostTelemetry = findClosest(
//             ghostTelemetries.current,
//             runTime * 1000,
//             (r) => r.timeStamp
//         );

//         if (!currentGhostTelemetry) return;

//         setGhostCurrentPosition({
//             lng: currentGhostTelemetry.lng,
//             lat: currentGhostTelemetry.lat,
//         });
//     }, [runTime, mode, currentRunType, runStatus]);

//     const heightVal = useSharedValue(0);

//     const controlPannelPosition = useAnimatedStyle(() => {
//         return {
//             top: heightVal.value - 116,
//         };
//     });

//     useEffect(() => {
//         if (isSaving) return;
//         if (runStatus === "stop_running") {
//             let count = 0;
//             const interval = setInterval(async () => {
//                 if (count * 4 === 60 * 1000) {
//                     Toast.show({
//                         type: "info",
//                         text1: "일반 러닝으로 전환합니다",
//                         position: "bottom",
//                         bottomOffset: 60,
//                         visibilityTime: 3000,
//                     });
//                     clearInterval(interval);
//                     await updateRunType("SOLO");
//                     setIsRestarting(true);
//                     return;
//                 }

//                 if (count % 2 === 0) {
//                     Toast.show({
//                         type: "info",
//                         text1: "코스를 이탈하였습니다",
//                         position: "bottom",
//                         bottomOffset: 60,
//                         visibilityTime: 3000,
//                     });
//                 } else {
//                     Toast.show({
//                         type: "info",
//                         text1: "10분 뒤 자동 종료됩니다",
//                         position: "bottom",
//                         bottomOffset: 60,
//                         visibilityTime: 3000,
//                     });
//                 }
//                 count++;
//             }, 4000);

//             return () => clearInterval(interval);
//         }
//     }, [runStatus, updateRunStatus, updateRunType, isSaving]);

//     useEffect(() => {
//         if (isFirst && !isRestarting) {
//             Toast.show({
//                 type: "info",
//                 text1: "시작 지점으로 이동해 주세요",
//                 position: "bottom",
//                 bottomOffset: 60,
//                 visibilityTime: 3000,
//             });
//         }
//     }, [isFirst, isRestarting]);

//     useEffect(() => {
//         const canSave =
//             isSaving && savingTelemetries.length > 0 && !!thumbnailUri;
//         const saveMode =
//             runStatus === "complete_course_running" ? "COURSE" : "SOLO";

//         if (!canSave) return;

//         (async () => {
//             try {
//                 const response = await saveRunning({
//                     telemetries: savingTelemetries,
//                     rawData: rawRunData,
//                     thumbnailUri,
//                     userDashboardData: runUserDashboardData,
//                     runTime,
//                     isPublic: true,
//                     courseId:
//                         saveMode === "COURSE" ? Number(courseId) : undefined,
//                     ghostRunningId:
//                         saveMode === "COURSE" && ghostRunningId !== "-1"
//                             ? Number(ghostRunningId)
//                             : undefined,
//                 });

//                 if (response) {
//                     if (
//                         runStatus === "complete_course_running" &&
//                         currentRunType === "SOLO"
//                     ) {
//                         Toast.show({
//                             type: "info",
//                             text1: "기록 저장에 성공했습니다. 러닝을 계속 진행합니다",
//                             position: "bottom",
//                             bottomOffset: 60,
//                         });
//                         setIsRestarting(true);
//                         setIsSaving(false);
//                         setSavingTelemetries([]);
//                         setThumbnailUri(null);
//                         return;
//                     } else {
//                         router.replace({
//                             pathname:
//                                 "/result/[runningId]/[courseId]/[ghostRunningId]",
//                             params: {
//                                 runningId: response.runningId.toString(),
//                                 courseId:
//                                     saveMode === "COURSE"
//                                         ? Number(courseId)
//                                         : -1,
//                                 ghostRunningId:
//                                     saveMode === "COURSE"
//                                         ? Number(ghostRunningId)
//                                         : -1,
//                             },
//                         });
//                     }
//                 } else {
//                     Toast.show({
//                         type: "info",
//                         text1: "기록 저장에 실패했습니다. 다시 시도해주세요.",
//                         position: "bottom",
//                         bottomOffset: 60,
//                     });
//                 }
//             } catch (e) {
//                 console.log(e);
//                 Toast.show({
//                     type: "info",
//                     text1: "기록 저장에 실패했습니다. 다시 시도해주세요.",
//                     position: "bottom",
//                     bottomOffset: 60,
//                 });
//             }
//             setSavingTelemetries([]);
//             setThumbnailUri(null);
//             setIsRestarting(true);
//         })();
//     }, [
//         isSaving,
//         savingTelemetries,
//         thumbnailUri,
//         runUserDashboardData,
//         runTime,
//         rawRunData,
//         router,
//         courseId,
//         ghostRunningId,
//         runStatus,
//         currentRunType,
//     ]);

//     const triggerSave = useCallback(() => {
//         if (isSaving) return;
//         const truncated = getTelemetriesWithoutLastFalse(runTelemetries);
//         setSavingTelemetries(truncated);
//         setIsSaving(true);
//     }, [isSaving, runTelemetries]);

//     const endRun = useCallback(async () => {
//         if (runStatus === "start_running") {
//             await updateRunStatus("pause_running");
//         } else {
//             router.back();
//         }
//     }, [runStatus, updateRunStatus, router]);

//     const resumeRun = useCallback(() => {
//         setIsRestarting(true);
//     }, []);

//     const switchToSolo = useCallback(async () => {
//         await updateRunType("SOLO");
//     }, [updateRunType]);

//     const actionDisabled = isRestarting || isSaving;

//     return (
//         <View style={[styles.container, { paddingBottom: bottom }]}>
//             {isSaving && (
//                 <>
//                     <LoadingLayer
//                         limitDelay={3000}
//                         onDelayed={() => {
//                             runShotRef.current
//                                 ?.capture()
//                                 .then((uri) => {
//                                     console.log("uri", uri);
//                                     setThumbnailUri(uri);
//                                 })
//                                 .catch((e) => {
//                                     setThumbnailUri("");
//                                 });
//                         }}
//                     />
//                     {savingTelemetries.length > 0 && (
//                         <RunShot
//                             ref={runShotRef}
//                             fileName={"runImage.jpg"}
//                             telemetries={savingTelemetries}
//                             type="thumbnail"
//                             onMapReady={() => {
//                                 console.log("onMapReady");
//                                 runShotRef.current
//                                     ?.capture()
//                                     .then((uri) => {
//                                         console.log("uri", uri);
//                                         setThumbnailUri(uri);
//                                     })
//                                     .catch((e) => {
//                                         setThumbnailUri("");
//                                         console.log(e);
//                                     })
//                                     .finally(() => {
//                                         console.log("finally capture");
//                                     });
//                             }}
//                         />
//                     )}
//                 </>
//             )}
//             <TopBlurView>
//                 <WeatherInfo />
//                 {isFirst ? (
//                     isRestarting ? (
//                         <Countdown
//                             count={3}
//                             color={colors.primary}
//                             size={60}
//                             onComplete={() => onCompleteRestart(runStatus)}
//                         />
//                     ) : (
//                         <Text style={styles.timeTextRed}>3</Text>
//                     )
//                 ) : isRestarting ? (
//                     <Countdown
//                         count={3}
//                         color={colors.primary}
//                         size={60}
//                         onComplete={() => onCompleteRestart(runStatus)}
//                     />
//                 ) : (
//                     <Animated.Text
//                         style={[styles.timeText, { color: colors.white }]}
//                         entering={FadeIn.duration(1000)}
//                     >
//                         {getRunTime(runTime, "MM:SS")}
//                     </Animated.Text>
//                 )}
//             </TopBlurView>
//             <MapViewWrapper controlPannelPosition={controlPannelPosition}>
//                 {/* 현재 기록에 대한 세그먼트 렌더링 */}
//                 {runSegments.map((segment, index) => (
//                     <RunningLine
//                         key={index.toString()}
//                         id={"course" + index.toString()}
//                         segment={segment}
//                         belowLayerID={
//                             mode === "GHOST" ? "custom-puck-layer-2" : undefined
//                         }
//                     />
//                 ))}
//                 {/* 코스에 대한 세그먼트 렌더링 */}
//                 {courseSegment && currentRunType === "COURSE" && (
//                     <RunningLine id="course" segment={courseSegment} />
//                 )}
//                 {/* 고스트에 대한 세그먼트 렌더링 */}
//                 {mode === "GHOST" &&
//                     currentRunType === "COURSE" &&
//                     ghostSegments.map((segment, index) => (
//                         <RunningLine
//                             key={index.toString()}
//                             id={"ghost" + index.toString()}
//                             segment={segment}
//                             belowLayerID="custom-puck-layer-2"
//                             color="red"
//                         />
//                     ))}
//                 {/* 코스 이탈 또는 일시정지 시 마지막 위치 렌더링 */}
//                 {currentRunType === "COURSE" &&
//                     (runStatus === "stop_running" ||
//                         runStatus === "pause_running" ||
//                         runStatus === "before_running") &&
//                     courseTelemetries.length > 0 && (
//                         <ShapeSource
//                             id="custom-puck"
//                             shape={{
//                                 type: "Point",
//                                 coordinates: [
//                                     courseTelemetries[courseIndex ?? 0].lng,
//                                     courseTelemetries[courseIndex ?? 0].lat,
//                                 ],
//                             }}
//                         >
//                             <SymbolLayer
//                                 id="custom-puck-layer"
//                                 style={{
//                                     iconImage: "puck2",
//                                     iconAllowOverlap: true,
//                                 }}
//                                 aboveLayerID="segment-course"
//                             />
//                         </ShapeSource>
//                     )}
//                 {/* 고스트에 대한 현재 위치 렌더링 */}
//                 {mode === "GHOST" && currentRunType === "COURSE" && (
//                     <ShapeSource
//                         id="custom-puck-2"
//                         shape={{
//                             type: "Point",
//                             coordinates: [
//                                 ghostCurrentPosition.lng,
//                                 ghostCurrentPosition.lat,
//                             ],
//                         }}
//                     >
//                         <SymbolLayer
//                             id="custom-puck-layer-2"
//                             style={{
//                                 iconImage: "puck3",
//                                 iconAllowOverlap: true,
//                             }}
//                             aboveLayerID="segment-course"
//                         />
//                     </ShapeSource>
//                 )}
//             </MapViewWrapper>
//             {runStatus === "complete_course_running" && (
//                 <PIConfetti
//                     ref={confettiRef}
//                     fallDuration={4000}
//                     count={100}
//                     colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
//                     fadeOutOnEnd={true}
//                     height={Dimensions.get("window").height / 2 - 100}
//                 />
//             )}
//             <BottomSheet
//                 backgroundStyle={styles.container}
//                 bottomInset={bottom + 56}
//                 handleStyle={styles.handle}
//                 handleIndicatorStyle={styles.handleIndicator}
//                 snapPoints={[15]}
//                 index={1}
//                 animatedPosition={heightVal}
//             >
//                 <BottomSheetView>
//                     <View style={styles.bottomSheetContent}>
//                         {runStatus === "complete_course_running" && (
//                             <CourseCompleteMessage courseName={courseName} />
//                         )}
//                         {isFirst ? (
//                             !isRestarting ? (
//                                 <EmptyListView
//                                     description={`러닝 기록을 위해\n코스 시작 지점으로 이동해 주세요`}
//                                     iconColor={colors.red}
//                                     fontSize="headline"
//                                     fontColor="white"
//                                 />
//                             ) : (
//                                 <EmptyListView
//                                     description={`러닝을 도중에 정지할 경우\n코스 및 러닝 기록 공개가 불가능합니다`}
//                                     iconColor={colors.red}
//                                     fontSize="headline"
//                                     fontColor="white"
//                                 />
//                             )
//                         ) : (
//                             <StatsIndicator
//                                 stats={[
//                                     {
//                                         label: "거리",
//                                         value: (
//                                             runUserDashboardData.totalDistance /
//                                             1000
//                                         ).toFixed(2),
//                                         unit: "km",
//                                     },
//                                     {
//                                         label: "평균 페이스",
//                                         value: getFormattedPace(
//                                             runUserDashboardData.averagePace
//                                         ),
//                                         unit: "",
//                                     },
//                                     {
//                                         label: "최근 페이스",
//                                         value: getFormattedPace(
//                                             runUserDashboardData.recentPointsPace
//                                         ),
//                                         unit: "",
//                                     },
//                                     {
//                                         label: "케이던스",
//                                         value: runUserDashboardData.averageCadence,
//                                         unit: "spm",
//                                     },
//                                     {
//                                         label: "심박수",
//                                         value: runUserDashboardData.bpm,
//                                         unit: "",
//                                     },
//                                     {
//                                         label: "소모 칼로리",
//                                         value: runUserDashboardData.totalCalories,
//                                         unit: "kcal",
//                                     },
//                                 ]}
//                                 ghost={
//                                     mode === "GHOST" &&
//                                     currentRunType === "COURSE"
//                                 }
//                                 ghostTelemetry={ghostTelemetries.current[0]}
//                                 color="gray20"
//                             />
//                         )}
//                     </View>
//                 </BottomSheetView>
//             </BottomSheet>
//             <DisplaySlideToAction
//                 status={runStatus}
//                 disabled={actionDisabled}
//                 onEndRun={endRun}
//                 onSave={triggerSave}
//                 onResume={resumeRun}
//                 onSwitchToSolo={switchToSolo}
//             />
//         </View>
//     );
// }

// const CourseCompleteMessage = ({ courseName }: { courseName: string }) => {
//     return (
//         <View style={styles.courseComplete}>
//             <View style={styles.courseCompleteText}>
//                 <Typography variant="headline" color="white">
//                     {courseName} 완주에 성공했어요!
//                 </Typography>
//                 <Typography variant="body3" color="gray40">
//                     이어 달릴 경우 기록은 자동 저장됩니다
//                 </Typography>
//             </View>
//             <Divider direction="horizontal" />
//         </View>
//     );
// };

// type DisplaySlideToActionProps = {
//     status: RunnningStatus;
//     disabled?: boolean;
//     onEndRun: () => void | Promise<void>;
//     onSave: () => void;
//     onResume: () => void;
//     onSwitchToSolo: () => void | Promise<void>;
// };

// function DisplaySlideToAction({
//     status,
//     disabled,
//     onEndRun,
//     onSave,
//     onResume,
//     onSwitchToSolo,
// }: DisplaySlideToActionProps) {
//     if (
//         status === "before_running" ||
//         status === "ready_course_running" ||
//         status === "start_running"
//     ) {
//         return (
//             <SlideToAction
//                 label="밀어서 러닝 종료"
//                 onSlideSuccess={onEndRun}
//                 color="red"
//                 direction="right"
//                 disabled={disabled}
//             />
//         );
//     }

//     if (status === "stop_running") {
//         return (
//             <SlideToDualAction
//                 leftLabel="러닝 종료"
//                 rightLabel="일반 러닝 전환"
//                 onSlideLeft={onSave}
//                 onSlideRight={onSwitchToSolo}
//                 color="red"
//             />
//         );
//     }

//     if (status === "pause_running") {
//         return (
//             <SlideToDualAction
//                 leftLabel="기록 저장"
//                 rightLabel="이어서 뛰기"
//                 onSlideLeft={onSave}
//                 onSlideRight={onResume}
//                 color="primary"
//                 disabled={disabled}
//             />
//         );
//     }

//     if (status === "complete_course_running") {
//         return (
//             <SlideToDualAction
//                 leftLabel="결과 및 랭킹"
//                 rightLabel="이어서 뛰기"
//                 onSlideLeft={onSave}
//                 onSlideRight={async () => {
//                     await onSwitchToSolo();
//                     onSave();
//                 }}
//                 color="primary"
//                 disabled={disabled}
//             />
//         );
//     }

//     return null;
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "#111111",
//         borderRadius: 0,
//     },
//     timeText: {
//         fontFamily: "SpoqaHanSansNeo-Bold",
//         fontSize: 60,
//         color: "white",
//         lineHeight: 81.3,
//         textAlign: "center",
//     },
//     timeTextRed: {
//         fontFamily: "SpoqaHanSansNeo-Bold",
//         fontSize: 60,
//         color: colors.red,
//         lineHeight: 81.3,
//         textAlign: "center",
//     },
//     bottomSheetContent: {
//         paddingVertical: 30,
//         gap: 30,
//     },
//     handle: {
//         paddingTop: 10,
//         paddingBottom: 0,
//     },
//     handleIndicator: {
//         backgroundColor: colors.gray[40],
//         width: 50,
//         height: 5,
//         borderRadius: 100,
//     },
//     courseComplete: {
//         marginBottom: 30,
//         alignItems: "center",
//         justifyContent: "center",
//         gap: 30,
//         paddingHorizontal: 17,
//     },
//     courseCompleteText: {
//         gap: 4,
//         alignItems: "center",
//         justifyContent: "center",
//     },
// });
