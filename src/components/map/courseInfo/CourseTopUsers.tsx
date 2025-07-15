import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../../ui/Typography";
import UserStatItem from "./UserStatItem";

interface CourseTopUsersProps {
    ghostList: any[];
    selectedGhostId?: number;
    setSelectedGhostId: (ghostId: number) => void;
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    courseId: number;
    marginHorizontal?: boolean;
}

export default function CourseTopUsers({
    ghostList,
    selectedGhostId,
    setSelectedGhostId,
    bottomSheetRef,
    courseId,
    marginHorizontal = true,
}: CourseTopUsersProps) {
    const router = useRouter();
    return (
        <View style={{ gap: 10 }}>
            <View
                style={[
                    styles.ghostListContainer,
                    marginHorizontal && { paddingHorizontal: 17 },
                ]}
            >
                <Typography variant="body1" color="gray40">
                    빠른 완주 순위
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
                    {ghostList.map((ghost, index) => (
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
