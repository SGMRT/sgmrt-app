import { Button } from "@/src/components/ui/Button";
import ButtonWithIcon from "@/src/components/ui/ButtonWithMap";
import { RunStatus } from "@/src/features/run/context/context";
import { useRouter } from "expo-router";
import { Alert, useWindowDimensions, View } from "react-native";
import { Confetti } from "react-native-fast-confetti";

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
                    colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
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
                <ButtonWithIcon
                    iconType="share"
                    title="러닝 종료"
                    onPressIcon={onShowShareBottomSheet}
                    onPress={handleNavigateToResult}
                    type="active"
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
            return <Button title="러닝 종료" onPress={handleEndRun} type="red" />;

        case "RUNNING":
        case "RUNNING_EXTENDED":
            return (
                <ButtonWithIcon
                    iconType="quit"
                    onPressIcon={handleQuit}
                    title="일시정지"
                    onPress={handlePause}
                    type="red"
                />
            );

        case "PAUSED_USER":
            return (
                <ButtonWithIcon
                    iconType="quit"
                    onPressIcon={handleQuit}
                    title="이어서 러닝"
                    onPress={handleResumeConfirm}
                    type="active"
                />
            );

        case "PAUSED_OFFCOURSE":
            return <Button title="러닝 종료" onPress={handleQuit} type="red" />;

        default:
            return null;
    }
}
