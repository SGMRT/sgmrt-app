import { RunShotHandle } from "@/src/components/share/RunShot";
import { ShareVariant } from "@/src/components/share/types";
import { ReplayRecorderHandle } from "@/src/features/replay/ReplayRecoder";
import { devLog } from "@/src/utils/devLog";
import { getDate } from "@/src/utils/runUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as FileSystem from "expo-file-system";
import { RefObject, useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import Share from "react-native-share";

export type ShareVariantWithVideo = ShareVariant | "video";

export interface UseResultShareParams {
    runningName?: string;
    startedAt?: number;
    bottom: number;
    showToast: (type: "success" | "info", message: string, bottom: number) => void;
}

export interface UseResultShareReturn {
    runShotVariant: ShareVariantWithVideo;
    replayProgress: number;
    runShotRef: RefObject<RunShotHandle | null>;
    shareBottomSheetRef: RefObject<BottomSheetModal | null>;
    replayRecoderRef: RefObject<ReplayRecorderHandle | null>;
    showShareBottomSheet: () => void;
    handleShareBottomSheetSelect: (variant: ShareVariantWithVideo) => void;
    handleShare: () => Promise<void>;
    setReplayProgress: (progress: number) => void;
}

export function useResultShare({
    runningName,
    startedAt,
    bottom,
    showToast,
}: UseResultShareParams): UseResultShareReturn {
    const [runShotVariant, setRunShotVariant] = useState<ShareVariantWithVideo>(
        "default" as ShareVariantWithVideo
    );
    const [replayProgress, setReplayProgress] = useState(-1);

    const runShotRef = useRef<RunShotHandle>(null);
    const shareBottomSheetRef = useRef<BottomSheetModal>(null);
    const replayRecoderRef = useRef<ReplayRecorderHandle>(null);

    const captureMap = useCallback(async () => {
        try {
            const uri = await runShotRef.current?.capture?.();
            const filename = runningName + ".png";
            const targetPath = `${FileSystem.cacheDirectory}${filename}`;
            devLog(targetPath);

            await FileSystem.copyAsync({
                from: uri ?? "",
                to: targetPath,
            });

            return targetPath;
        } catch (error) {
            devLog("captureMap error: ", error);
            return null;
        }
    }, [runningName]);

    const showShareBottomSheet = useCallback(() => {
        shareBottomSheetRef.current?.present();
    }, []);

    const handleShareBottomSheetSelect = useCallback(
        (variant: ShareVariantWithVideo) => {
            setRunShotVariant(variant);
        },
        []
    );

    const handleShareVideo = useCallback(async () => {
        try {
            shareBottomSheetRef.current?.dismiss();
            replayRecoderRef.current?.reset();
            setReplayProgress(-1);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await replayRecoderRef.current?.startRecording();
        } catch {
            showToast("info", "공유에 실패했습니다", bottom);
            setReplayProgress(-1);
        }
    }, [bottom, showToast]);

    const handleShare = useCallback(async () => {
        if (runShotVariant !== "video") {
            const uri = await captureMap();
            Share.open({
                title: runningName,
                message: getDate(startedAt ?? new Date().getTime()).trim(),
                filename: runningName ?? "run.png",
                url: uri ?? "",
            })
                .then((res) => {
                    devLog(res);
                    if (res.success) {
                        trackAmplitude("Run Shared", {
                            variant: runShotVariant,
                        });
                    }
                })
                .catch((err) => {
                    err && devLog(err);
                });
            shareBottomSheetRef.current?.dismiss();
        } else {
            Alert.alert(
                "실험 기능 안내",
                "이 기능은 현재 실험 중인 기능입니다.\n처리 과정에 다소 시간이 소요될 수 있으며, 실행 중에도 언제든 취소하실 수 있습니다.\n계속 진행하시겠습니까?",
                [
                    { text: "취소", style: "cancel" },
                    {
                        text: "계속 진행",
                        style: "default",
                        onPress: handleShareVideo,
                    },
                ]
            );
        }
    }, [runShotVariant, captureMap, runningName, startedAt, handleShareVideo]);

    return {
        runShotVariant,
        replayProgress,
        runShotRef,
        shareBottomSheetRef,
        replayRecoderRef,
        showShareBottomSheet,
        handleShareBottomSheetSelect,
        handleShare,
        setReplayProgress,
    };
}
