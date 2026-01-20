import { markPacemakerAsRun } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import { RunShotHandle } from "@/src/components/share/RunShot";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import { RunSaveResult } from "@/src/features/run/components/RunControlButtons";
import { RunContext } from "@/src/features/run/state/context";
import { buildUserRecordData } from "@/src/features/run/state/record";
import { extractRawData } from "@/src/features/run/utils/extractRawData";
import { getRunName, saveRunning } from "@/src/utils/runUtils";
import { captureError } from "@/src/utils/sentryTools";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export interface UseRunSaveFlowParams {
    context: RunContext;
    controls: {
        stop: () => void;
    };
    courseId: string | string[];
    ghostRunningId: string | string[];
    ghostyId: string | string[] | undefined;
    isClearCourse: boolean;
    findByCourseId: (courseId: number) => { jobId: string } | undefined;
    removeJob: (jobId: string) => void;
}

export interface UseRunSaveFlowReturn {
    isSaving: boolean;
    savingTelemetries: Telemetry[];
    thumbnailUri: string | null;
    runShotType: "thumbnail" | "share";
    runSaveResult: RunSaveResult | null;
    runShotRef: RefObject<RunShotHandle | null>;
    hasSavedRef: RefObject<boolean>;
    requestSave: () => void;
    triggerCapture: () => void;
    setWithRouting: (value: boolean) => void;
    setRunShotType: (type: "thumbnail" | "share") => void;
    captureMap: () => Promise<string | null>;
}

export function useRunSaveFlow({
    context,
    controls,
    courseId,
    ghostRunningId,
    ghostyId,
    isClearCourse,
    findByCourseId,
    removeJob,
}: UseRunSaveFlowParams): UseRunSaveFlowReturn {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [isSaving, setIsSaving] = useState(false);
    const [savingTelemetries, setSavingTelemetries] = useState<Telemetry[]>([]);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
    const [runShotType, setRunShotType] = useState<"thumbnail" | "share">(
        "thumbnail"
    );
    const [runSaveResult, setRunSaveResult] = useState<RunSaveResult | null>(
        null
    );
    const [withRouting, setWithRouting] = useState(false);

    const runShotRef = useRef<RunShotHandle>(null);
    const hasSavedRef = useRef(false);

    const triggerCapture = useCallback(() => {
        runShotRef.current
            ?.capture()
            .then((uri) => setThumbnailUri(uri))
            .catch(() => setThumbnailUri(""));
    }, []);

    const captureMap = useCallback(async () => {
        try {
            const uri = await runShotRef.current?.capture?.();
            const filename =
                getRunName(context.telemetries.at(-1)?.timeStamp ?? 0) + ".png";
            const targetPath = `${FileSystem.cacheDirectory}${filename}`;

            await FileSystem.copyAsync({
                from: uri ?? "",
                to: targetPath,
            });

            return targetPath;
        } catch {
            return null;
        }
    }, [context.telemetries]);

    const requestSave = useCallback(() => {
        if (isSaving) return;
        if (!context.telemetries.length) {
            router.back();
            return;
        }
        hasSavedRef.current = false;
        setSavingTelemetries(context.telemetries);
        setIsSaving(true);
        controls.stop();
    }, [isSaving, context.telemetries, controls, router]);

    // URI가 생기는 순간 저장 수행
    useEffect(() => {
        if (!isSaving) return;
        if (!thumbnailUri) return;
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        (async () => {
            try {
                const userRecordData = buildUserRecordData(context.stats);

                const saveGhostId = !isClearCourse
                    ? undefined
                    : Number(ghostRunningId) !== -1
                    ? Number(ghostRunningId)
                    : undefined;

                const saveCourseId = !isClearCourse
                    ? undefined
                    : Number(courseId);

                const response = await saveRunning({
                    telemetries: context.telemetries,
                    rawData: extractRawData(context.mainTimeline),
                    thumbnailUri,
                    userDashboardData: userRecordData,
                    runTime: Math.round(context.stats.totalTimeMs / 1000),
                    isPublic: true,
                    ghostRunningId: saveGhostId,
                    courseId: saveCourseId,
                });

                setRunSaveResult({
                    runningId: response.runningId,
                    courseId: saveCourseId,
                    ghostRunningId: saveGhostId,
                });

                if (ghostyId && response.runningId) {
                    await markPacemakerAsRun(
                        Number(ghostyId),
                        response.runningId
                    );
                    queryClient.invalidateQueries({
                        queryKey: ["pacemaker", Number(courseId)],
                    });
                    queryClient.invalidateQueries({
                        queryKey: ["pacemakerDetail", Number(ghostyId)],
                    });
                    const job = findByCourseId(Number(courseId));
                    if (job) {
                        removeJob(job.jobId);
                    }
                }

                if (withRouting) {
                    router.replace({
                        pathname:
                            "/stats/result/[runningId]/[courseId]/[ghostRunningId]",
                        params: {
                            runningId: response.runningId.toString(),
                            courseId: saveCourseId ?? "-1",
                            ghostRunningId: saveGhostId ?? "-1",
                        },
                    });
                }
                setThumbnailUri(null);
                if (!withRouting) setRunShotType("share");
            } catch (error) {
                showCompactToast("기록 저장에 실패했습니다. 다시 시도해주세요.");
                captureError("run.course.saveRunning", error);
            } finally {
                queryClient.invalidateQueries({
                    queryKey: ["runs"],
                });
                setIsSaving(false);
            }
        })();
    }, [
        withRouting,
        isSaving,
        thumbnailUri,
        context.telemetries,
        context.mainTimeline,
        router,
        context.stats,
        ghostRunningId,
        courseId,
        isClearCourse,
        queryClient,
        ghostyId,
        findByCourseId,
        removeJob,
    ]);

    return {
        isSaving,
        savingTelemetries,
        thumbnailUri,
        runShotType,
        runSaveResult,
        runShotRef,
        hasSavedRef,
        requestSave,
        triggerCapture,
        setWithRouting,
        setRunShotType,
        captureMap,
    };
}
