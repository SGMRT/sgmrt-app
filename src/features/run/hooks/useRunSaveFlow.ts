import { markPacemakerAsRun } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import { RunShotHandle } from "@/src/components/share/RunShot";
import { showCompactToast } from "@/src/components/ui/feedback/toastConfig";
import { RunSaveResult } from "@/src/features/run/components/RunControlButtons";
import { RunContext } from "@/src/features/run/context/context";
import { buildUserRecordData } from "@/src/features/run/context/record";
import { RunningStats } from "@/src/features/run/context/stats";
import { RawRunData } from "@/src/features/run/types";
import { extractRawData } from "@/src/features/run/utils/extractRawData";
import { getRunName, saveRunning } from "@/src/utils/runUtils";
import { SaveRunningError } from "@/src/utils/runUtils/saveRunning";
import { captureError } from "@/src/utils/sentryTools";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

const CAPTURE_TIMEOUT_MS = 10000;

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

type CaptureState = "IDLE" | "PENDING" | "DONE";

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
    const [savingMainTimeline, setSavingMainTimeline] = useState<RawRunData[]>([]);
    const [savingStats, setSavingStats] = useState<RunningStats | null>(null);
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
    const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [captureState, setCaptureState] = useState<CaptureState>("IDLE");

    const triggerCapture = useCallback(() => {
        // 이미 캡처 중이거나 완료된 경우 무시
        if (captureState !== "IDLE") return;
        setCaptureState("PENDING");

        // 타임아웃 설정: 캡처가 너무 오래 걸리면 실패 처리
        captureTimeoutRef.current = setTimeout(() => {
            captureError("run.course.captureTimeout", new Error("Capture timeout"));
            setThumbnailUri(null);
            setCaptureState("DONE");
        }, CAPTURE_TIMEOUT_MS);

        runShotRef.current
            ?.capture()
            .then((uri) => {
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
                setThumbnailUri(uri || null);
                setCaptureState("DONE");
            })
            .catch((error) => {
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
                captureError("run.course.capture", error);
                // 캡처 실패해도 저장은 진행 (썸네일 없이)
                setThumbnailUri(null);
                setCaptureState("DONE");
            });
    }, [captureState]);

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
        // 저장 시점의 데이터 캡처 (이후 도착하는 데이터는 무시)
        setSavingTelemetries(context.telemetries);
        setSavingMainTimeline(context.mainTimeline);
        setSavingStats(context.stats);
        setIsSaving(true);
        controls.stop();
    }, [isSaving, context.telemetries, context.mainTimeline, context.stats, controls, router]);

    // 저장 시점에 사용할 값을 ref로 캡처 (closure 문제 방지)
    const isClearCourseRef = useRef(isClearCourse);
    useEffect(() => {
        isClearCourseRef.current = isClearCourse;
    }, [isClearCourse]);

    // 캡처 완료(성공/실패) 시 저장 수행
    useEffect(() => {
        if (!isSaving) return;
        if (captureState !== "DONE") return; // 캡처 완료 대기
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        (async () => {
            // 캡처된 데이터가 없으면 저장 불가
            if (!savingStats) {
                captureError("run.course.saveRunning", new Error("savingStats is null"));
                showCompactToast("저장할 데이터가 없습니다.");
                hasSavedRef.current = false;
                return;
            }

            try {
                // 저장 시점에 캡처된 데이터 사용
                const userRecordData = buildUserRecordData(savingStats);

                // ref에서 최신 값 사용
                const currentIsClearCourse = isClearCourseRef.current;

                const saveGhostId = !currentIsClearCourse
                    ? undefined
                    : Number(ghostRunningId) !== -1
                    ? Number(ghostRunningId)
                    : undefined;

                const saveCourseId = !currentIsClearCourse
                    ? undefined
                    : Number(courseId);

                const response = await saveRunning({
                    telemetries: savingTelemetries,
                    rawData: extractRawData(savingMainTimeline),
                    thumbnailUri,
                    userDashboardData: userRecordData,
                    runTime: Math.round(savingStats.totalTimeMs / 1000),
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
                    try {
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
                    } catch (pacemakerError) {
                        // 페이스메이커 마킹 실패는 저장 자체는 성공이므로 에러만 기록
                        captureError("run.course.markPacemaker", pacemakerError);
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
            } catch (error: unknown) {
                if (error instanceof SaveRunningError) {
                    showCompactToast(error.message);
                } else {
                    showCompactToast("기록 저장에 실패했습니다. 다시 시도해주세요.");
                }
                // saveRunning 내부에서 이미 Sentry 보고된 에러는 중복 보고하지 않음
                const anyErr = error as { tracked?: boolean };
                if (!anyErr?.tracked) {
                    captureError("run.course.saveRunning", error as Error);
                }
                // 저장 실패 시 재시도 가능하도록 상태 초기화
                hasSavedRef.current = false;
            } finally {
                queryClient.invalidateQueries({
                    queryKey: ["runs"],
                });
                setIsSaving(false);
                setCaptureState("IDLE");
                if (captureTimeoutRef.current) {
                    clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = null;
                }
            }
        })();
    }, [
        withRouting,
        isSaving,
        captureState,
        thumbnailUri,
        savingTelemetries,
        savingMainTimeline,
        savingStats,
        router,
        ghostRunningId,
        courseId,
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
