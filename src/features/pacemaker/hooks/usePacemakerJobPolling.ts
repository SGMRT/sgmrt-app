import { getPacemakerDetail } from "@/src/apis";
import { devLog } from "@/src/utils/devLog";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { shallow } from "zustand/shallow";
import { usePacemakerQueue } from "../store/queueStore";
import { PacemakerJob } from "../types";

type PollOptions = {
    intervalMs?: number;
    concurrency?: number;
};

export function usePacemakerJobPolling({
    intervalMs = 2000,
    concurrency = 3,
}: PollOptions = {}) {
    const jobs = usePacemakerQueue((s) => s.jobs);
    const setStatus = usePacemakerQueue((s) => s.setStatus);

    const queryClient = useQueryClient();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inFlight = useRef<Set<number>>(new Set());

    // queued 된지 1분 30초 이상 된 애들만 폴링
    const pendingJobs = useMemo(
        () => jobs.filter((j) => j.status === "PROCEEDING"),
        [jobs]
    );

    const tick = useCallback(async () => {
        devLog("[usePacemakerJobPolling] tick");
        if (!pendingJobs.length) return;

        const ready = pendingJobs.filter((j) => {
            const queuedMs = new Date(j.queuedAt).getTime();
            if (queuedMs + 90_000 > Date.now()) return false;
            return true;
        });

        const candidates = ready
            .filter((j) => !inFlight.current.has(j.pacemakerId))
            .slice(0, Math.max(1, concurrency));

        if (!candidates.length) return;

        devLog("[usePacemakerJobPolling] candidates", candidates);

        await Promise.allSettled(
            candidates.map(async (job) => {
                inFlight.current.add(job.pacemakerId);
                try {
                    const detail = await getPacemakerDetail(job.pacemakerId);
                    const status = detail.processingStatus;

                    devLog(
                        "[usePacemakerJobPolling] job.pacemakerId",
                        job.pacemakerId,
                        "status",
                        status
                    );

                    if (status === "FAILED") {
                        setStatus(
                            job.jobId,
                            "FAILED",
                            "Pacemaker processing FAILED"
                        );
                        return;
                    }

                    if (status === "COMPLETED") {
                        setStatus(job.jobId, "COMPLETED");
                        await queryClient.invalidateQueries({
                            queryKey: ["pacemaker", job.courseId],
                        });
                        await queryClient.invalidateQueries({
                            queryKey: ["pacemakerDetail", job.pacemakerId],
                        });
                        return;
                    }
                } catch (error) {
                    if (isAxiosError(error)) {
                        const status = error.response?.status;
                        if (status === 404) {
                            setStatus(
                                job.jobId,
                                "FAILED",
                                "Pacemaker not found"
                            );
                            return;
                        }
                    }
                } finally {
                    inFlight.current.delete(job.pacemakerId);
                }
            })
        );
    }, [pendingJobs, concurrency, queryClient, setStatus]);

    useEffect(() => {
        const unsub = usePacemakerQueue.subscribe(
            (s) => s.jobs,
            (_next: PacemakerJob[], _prev: PacemakerJob[]) => {
                tick().catch(() => {});
            },
            { equalityFn: shallow }
        );
        return unsub;
    }, [tick]);

    useEffect(() => {
        const clearTimer = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };

        const ensureTimer = () => {
            if (timerRef.current) return;
            if (!pendingJobs.length) return;
            timerRef.current = setInterval(() => {
                tick().catch(() => {});
            }, intervalMs);
        };

        if (pendingJobs.length) ensureTimer();
        else clearTimer();

        return () => {
            clearTimer();
            inFlight.current.clear();
        };
    }, [pendingJobs.length, intervalMs, tick]);
}
