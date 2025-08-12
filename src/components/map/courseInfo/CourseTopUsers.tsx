import { ElipsisVerticalIcon } from "@/assets/svgs/svgs";
import { getCourseUserRank } from "@/src/apis";
import { HistoryResponse, UserRankResponse } from "@/src/apis/types/course";
import { useAuthStore } from "@/src/store/authState";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import ExpendHeader from "../../ui/ExpendHeader";
import { TypographyColor } from "../../ui/Typography";
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
    const [myRecord, setMyRecord] = useState<UserRankResponse | null>(null);
    const { uuid } = useAuthStore();

    useEffect(() => {
        if (includeMyRecord) return;
        async function getMyRecord() {
            const record = await getCourseUserRank({
                courseId,
                memberUuid: uuid ?? "",
            });
            setMyRecord(record);
        }
        getMyRecord();
    }, [uuid, includeMyRecord, courseId]);

    useEffect(() => {
        if (uuid && ghostList.map((ghost) => ghost.runnerUuid).includes(uuid)) {
            setIncludeMyRecord(true);
        }
    }, [ghostList, uuid]);

    return (
        <View style={{ gap: 10 }}>
            <ExpendHeader
                title={`${userCount}명 참여`}
                titleColor={titleColor}
                marginHorizontal={marginHorizontal}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/course/${courseId}/rank`);
                }}
            />
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
                                isMyRecord={ghost.runnerUuid === uuid}
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
                                cadence={"--" + " spm"}
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
    marginBottom: {
        marginBottom: 20,
    },
});
