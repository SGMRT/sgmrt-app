import { ChevronIcon, ElipsisVerticalIcon } from "@/assets/svgs/svgs";
import { getCourseUserRank } from "@/src/apis";
import { HistoryResponse } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography, TypographyColor } from "../../ui/Typography";
import UserStatItem from "./UserStatItem";

interface CourseTopUsersProps {
    ghostList: HistoryResponse[];
    selectedGhostId?: number;
    setSelectedGhostId: (ghostId: number) => void;
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    courseId: number;
    userCount: number;
    marginHorizontal?: boolean;
    titleColor?: TypographyColor;
}

export default function CourseTopUsers({
    ghostList,
    selectedGhostId,
    setSelectedGhostId,
    bottomSheetRef,
    courseId,
    marginHorizontal = true,
    userCount,
    titleColor = "gray40",
}: CourseTopUsersProps) {
    const router = useRouter();
    const [includeMyRecord, setIncludeMyRecord] = useState(false);
    const [myRecord, setMyRecord] = useState<HistoryResponse | null>(null);

    const myId = 1;

    useEffect(() => {
        if (includeMyRecord) return;
        async function getMyRecord() {
            const record = await getCourseUserRank({
                courseId,
                userId: myId,
            });
            console.log("myRecord", record);
            setMyRecord(record);
        }
        getMyRecord();
    }, [myId, includeMyRecord, courseId]);

    useEffect(() => {
        if (ghostList.map((ghost) => ghost.runnerId).includes(myId)) {
            setIncludeMyRecord(true);
        }
    }, [ghostList, myId]);

    return (
        <View style={{ gap: 10 }}>
            <View
                style={[
                    styles.ghostListContainer,
                    marginHorizontal && { paddingHorizontal: 17 },
                ]}
            >
                <Typography variant="body1" color={titleColor}>
                    {userCount}명 참여
                </Typography>
                <View style={styles.ghostListContainerText}>
                    <Pressable
                        onPress={() => {
                            bottomSheetRef.current?.dismiss();
                            router.push(`/course/${courseId}`);
                        }}
                    >
                        <Typography variant="body2" color="gray60">
                            전체 보기
                        </Typography>
                    </Pressable>
                    <ChevronIcon color={colors.gray[60]} />
                </View>
            </View>
            {ghostList && ghostList.length > 0 && (
                <View style={styles.marginBottom}>
                    {ghostList
                        .filter((_, index) =>
                            includeMyRecord ? true : index < 2
                        )
                        .map((ghost, index) => (
                            <UserStatItem
                                key={ghost.runningId}
                                rank={index + 1}
                                name={ghost.runningName}
                                avatar={ghost.runnerProfileUrl}
                                time={getRunTime(ghost.duration, "MM:SS")}
                                pace={getFormattedPace(ghost.averagePace)}
                                cadence={ghost.cadence.toString() + " spm"}
                                ghostId={ghost.runningId.toString()}
                                isGhostSelected={
                                    selectedGhostId === ghost.runningId
                                }
                                onPress={() => {
                                    setSelectedGhostId(ghost.runningId);
                                }}
                                isMyRecord={ghost.runnerId === 1}
                                paddingHorizontal={marginHorizontal}
                            />
                        ))}
                    {myRecord && !includeMyRecord && (
                        <>
                            <ElipsisVerticalIcon
                                style={{ alignSelf: "center" }}
                            />
                            <UserStatItem
                                rank={myRecord.rank ?? "-"}
                                name={myRecord.runningName}
                                avatar={myRecord.runnerProfileUrl}
                                time={getRunTime(myRecord.duration, "MM:SS")}
                                pace={getFormattedPace(myRecord.averagePace)}
                                cadence={myRecord.cadence ?? "--" + " spm"}
                                isMyRecord={true}
                                isGhostSelected={
                                    selectedGhostId === myRecord.runningId
                                }
                                onPress={() => {
                                    setSelectedGhostId(myRecord.runningId);
                                }}
                            />
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    ghostListContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    ghostListContainerText: {
        flexDirection: "row",
        alignItems: "center",
    },
    marginBottom: {
        marginBottom: 20,
    },
});
