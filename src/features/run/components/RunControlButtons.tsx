import { ButtonWithMap } from "@/src/components/ui";
import { Button } from "@/src/design-system/atoms/Button";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { spacing } from "@/src/design-system/tokens/spacing";
import { RunStatus } from "@/src/features/run/context/context";
import { useRouter } from "expo-router";
import {
    Alert,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Confetti } from "react-native-fast-confetti";
import { darkTheme } from "@/src/design-system/themes/dark";
import { core } from "@/src/design-system/tokens/colors";

export interface RunSaveResult {
    runningId: number;
    ghostRunningId: number | undefined;
    courseId: number | undefined;
}

interface Props {
    status: RunStatus;
    runShotType: "thumbnail" | "share";
    totalDistanceM: number;
    runSaveResult: RunSaveResult | null;
    onStop: () => void;
    onPauseUser: () => void;
    onResume: () => void;
    onRequestSave: () => void;
    onShowShareBottomSheet: () => void;
}

export default function RunControlButtons({
    status,
    runShotType,
    totalDistanceM,
    runSaveResult,
    onStop,
    onPauseUser,
    onResume,
    onRequestSave,
    onShowShareBottomSheet,
}: Props) {
    const router = useRouter();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const handleQuit = () => {
        Alert.alert("러닝을 종료할까요?", "500m 이하의 러닝은 저장되지 않아요", [
            {
                text: "저장하기",
                style: "default",
                onPress: () => {
                    if (totalDistanceM < 500) {
                        onStop();
                        router.back();
                    } else {
                        onRequestSave();
                    }
                },
            },
            {
                text: "뒤로가기",
                style: "destructive",
            },
        ]);
    };

    const handlePause = () => {
        Alert.alert(
            "러닝을 일시정지할까요?",
            "일시정지 후 이어 달린 기록은 고스트가 생성되지 않아요",
            [
                {
                    text: "계속러닝",
                    style: "default",
                },
                {
                    text: "일시정지",
                    style: "destructive",
                    onPress: onPauseUser,
                },
            ]
        );
    };

    const handleResumeConfirm = () => {
        Alert.alert(
            "러닝을 이어서 시작할까요?",
            "계속러닝을 누르면 이어서 러닝이 가능해요",
            [
                { text: "취소", style: "default" },
                {
                    text: "계속러닝",
                    style: "destructive",
                    onPress: onResume,
                },
            ]
        );
    };

    const handleEndRun = () => {
        onStop();
        router.back();
    };

    const handleNavigateToResult = () => {
        if (runSaveResult) {
            router.replace({
                pathname: "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                params: {
                    runningId: runSaveResult.runningId.toString(),
                    courseId: runSaveResult.courseId?.toString() ?? "-1",
                    ghostRunningId: runSaveResult.ghostRunningId?.toString() ?? "-1",
                },
            });
        }
    };

    if (runShotType === "share") {
        return (
            <>
                <Confetti
                    fallDuration={4000}
                    count={100}
                    colors={["#d9d9d9", darkTheme.primary, core.white]}
                    flakeSize={{ width: 12, height: 8 }}
                    fadeOutOnEnd={true}
                    cannonsPositions={[
                        { x: windowWidth / 2, y: windowHeight - 440 },
                        { x: windowWidth / 2, y: windowHeight - 440 },
                    ]}
                    blastDuration={800}
                    autoplay={true}
                    isInfinite={false}
                />
                <ButtonWithMap
                    iconType="share"
                    title="러닝 종료"
                    onPressIcon={onShowShareBottomSheet}
                    onPress={handleNavigateToResult}
                />
            </>
        );
    }

    // runShotType === "thumbnail"
    switch (status) {
        case "IDLE":
        case "READY":
        case "STOPPED":
        case "COMPLETION_PENDING":
            return <EndRunButton onPress={handleEndRun} />;

        case "RUNNING":
        case "RUNNING_EXTENDED":
            return (
                <ButtonWithMap
                    iconType="quit"
                    onPressIcon={handleQuit}
                    title="일시정지"
                    onPress={handlePause}
                    theme="secondary"
                />
            );

        case "PAUSED_USER":
            return (
                <ButtonWithMap
                    iconType="quit"
                    onPressIcon={handleQuit}
                    title="이어서 러닝"
                    onPress={handleResumeConfirm}
                />
            );

        case "PAUSED_OFFCOURSE":
            return <EndRunButton onPress={handleQuit} />;

        default:
            return null;
    }
}

/**
 * 러닝을 끝내는 주 행동. 화면 아래에 홀로 놓인다.
 *
 * 곁딸린 행동이 있는 상태에서는 ButtonWithMap 이 같은 자리를 차지하므로,
 * 바깥 여백을 그쪽과 같은 값으로 맞춰 두 상태 사이에서 버튼이 움직이지 않게 한다.
 */
function EndRunButton({ onPress }: { onPress: () => void }) {
    return (
        <View style={endRunStyles.container}>
            <Button
                title="러닝 종료"
                onPress={onPress}
                size="large"
                theme="secondary"
                block
            />
        </View>
    );
}

const endRunStyles = StyleSheet.create({
    container: {
        marginHorizontal: screenGutter,
        paddingTop: spacing[12],
    },
});
