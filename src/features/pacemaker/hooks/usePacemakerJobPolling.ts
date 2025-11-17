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
    maxAttempts?: number; // 최대 재시도 횟수
    baseBackoffMs?: number; // 첫 백오프 기준(ms)
    maxBackoffMs?: number; // 백오프 상한(ms)
};

type FailureMeta = {
    attempts: number;
    nextAt: number;
};

export function usePacemakerJobPolling({
    intervalMs = 2000,
    concurrency = 3,
    maxAttempts = 3,
    baseBackoffMs = 5_000,
    maxBackoffMs = 60_000,
}: PollOptions = {}) {
    const jobs = usePacemakerQueue((s) => s.jobs);
    const setStatus = usePacemakerQueue((s) => s.setStatus);

    const queryClient = useQueryClient();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inFlight = useRef<Set<number>>(new Set());

    const failureMetaRef = useRef<Map<string, FailureMeta>>(new Map());

    // PROCEEDING 상태인 잡만 폴링 대상
    const pendingJobs = useMemo(
        () => jobs.filter((j) => j.status === "PROCEEDING"),
        [jobs]
    );

    const tick = useCallback(async () => {
        devLog("[usePacemakerJobPolling] tick");
        if (!pendingJobs.length) return;

        const now = Date.now();

        // 1) queued 후 90초 이상 경과
        // 2) backoff(nextAt) 조건 만족한 애들만 후보
        const ready = pendingJobs.filter((j) => {
            const queuedMs = new Date(j.queuedAt).getTime();
            if (queuedMs + 90_000 > now) return false;

            const meta = failureMetaRef.current.get(j.jobId);
            if (meta && meta.nextAt > now) {
                // 아직 백오프 기간
                return false;
            }

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

                const finishJob = (
                    status: "COMPLETED" | "FAILED",
                    reason?: string
                ) => {
                    setStatus(job.jobId, status, reason);
                    failureMetaRef.current.delete(job.jobId);
                };

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
                        finishJob("FAILED", "Pacemaker processing FAILED");
                        return;
                    }

                    if (status === "COMPLETED") {
                        finishJob("COMPLETED");
                        await queryClient.invalidateQueries({
                            queryKey: ["pacemaker", job.courseId],
                        });
                        await queryClient.invalidateQueries({
                            queryKey: ["pacemakerDetail", job.pacemakerId],
                        });
                        return;
                    }
                } catch (error) {
                    // 에러 처리 & 백오프
                    if (isAxiosError(error)) {
                        const status = error.response?.status;

                        if (status === 404) {
                            finishJob("FAILED", "Pacemaker not found");
                            return;
                        }

                        // 400대 에러는 재시도 가치 없음
                        if (
                            status &&
                            status >= 400 &&
                            status < 500 &&
                            status !== 429
                        ) {
                            finishJob("FAILED", "Pacemaker processing FAILED");
                            return;
                        }
                    }

                    const prev = failureMetaRef.current.get(job.jobId) ?? {
                        attempts: 0,
                        nextAt: 0,
                    };

                    const attempts = prev.attempts + 1;

                    if (attempts >= maxAttempts) {
                        finishJob(
                            "FAILED",
                            `Pacemaker polling failed after ${attempts} attempts`
                        );
                        return;
                    }

                    // 지수 백오프 계산
                    const base = baseBackoffMs * Math.pow(2, attempts - 1);
                    const backoff = Math.min(base, maxBackoffMs);

                    // 지터 추가
                    const jitterFactor = 1 + (Math.random() * 0.4 - 0.2);
                    const nextAt = Date.now() + backoff * jitterFactor;

                    failureMetaRef.current.set(job.jobId, {
                        attempts,
                        nextAt,
                    });

                    devLog("[usePacemakerJobPolling] backoff", {
                        jobId: job.jobId,
                        attempts,
                        nextAt,
                    });
                } finally {
                    inFlight.current.delete(job.pacemakerId);
                }
            })
        );
    }, [
        pendingJobs,
        concurrency,
        queryClient,
        setStatus,
        baseBackoffMs,
        maxBackoffMs,
        maxAttempts,
    ]);

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
            failureMetaRef.current.clear();
        };
    }, [pendingJobs.length, intervalMs, tick]);
}
