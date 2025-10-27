import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import {
    createJSONStorage,
    persist,
    subscribeWithSelector,
} from "zustand/middleware";
import { PacemakerJob } from "../types";

type State = {
    jobs: PacemakerJob[];
    hydrated: boolean;
};

type Actions = {
    addJob: (
        job: Omit<PacemakerJob, "queuedAt" | "updatedAt" | "jobId">
    ) => PacemakerJob;
    patchJob: (jobId: string, patch: Partial<PacemakerJob>) => void;
    setStatus: (
        jobId: string,
        status: "PROCESSING" | "SUCCEED" | "FAILED",
        error?: string
    ) => void;
    removeJob: (jobId: string) => void;
    removeAllJobs: () => void;
    findAll: () => PacemakerJob[];
    findInProgress: () => PacemakerJob[];
    findCompleted: () => PacemakerJob[];
    findByCourseId: (courseId: number) => PacemakerJob | undefined;
    findByPacemakerId: (pacemakerId: number) => PacemakerJob | undefined;
    pinnedCourseIds: () => number[];
};

export const usePacemakerQueue = create<State & Actions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                jobs: [],
                hydrated: false,

                addJob: (job) => {
                    const existingJob = get().findByCourseId(job.courseId);
                    if (existingJob) {
                        get().removeJob(existingJob.jobId);
                    }
                    const now = new Date().toISOString();
                    const newJob: PacemakerJob = {
                        ...job,
                        jobId: uuidv4(),
                        queuedAt: now,
                        updatedAt: now,
                    };
                    set((s) => ({ jobs: [...s.jobs, newJob] }));
                    return newJob;
                },

                patchJob: (jobId, patch) => {
                    const now = new Date().toISOString();
                    set((s) => ({
                        jobs: s.jobs.map((j) =>
                            j.jobId === jobId
                                ? { ...j, ...patch, updatedAt: now }
                                : j
                        ),
                    }));
                },

                setStatus: (jobId, status, error) => {
                    get().patchJob(jobId, {
                        status,
                        error,
                        updatedAt: new Date().toISOString(),
                    });
                },

                removeJob: (jobId) => {
                    set((s) => ({
                        jobs: s.jobs.filter((j) => j.jobId !== jobId),
                    }));
                },
                removeAllJobs: () => {
                    set({ jobs: [] });
                },
                findAll: () => {
                    return get().jobs;
                },
                findInProgress: () => {
                    return get().jobs.filter((j) => j.status === "PROCESSING");
                },
                findCompleted: () => {
                    return get().jobs.filter((j) => j.status === "SUCCEED");
                },
                findByCourseId: (courseId) => {
                    return get().jobs.find((j) => j.courseId === courseId);
                },
                findByPacemakerId: (pacemakerId) => {
                    return get().jobs.find(
                        (j) => j.pacemakerId === pacemakerId
                    );
                },

                pinnedCourseIds: () => {
                    const ids = Array.from(
                        new Set(
                            get()
                                .jobs.filter((job) => job.status !== "FAILED")
                                .map((job) => job.courseId)
                        )
                    );
                    return ids;
                },
            }),
            {
                name: "pacemaker.jobs.v1",
                storage: createJSONStorage(() => AsyncStorage),
                partialize: (state) => ({ jobs: state.jobs }),
                version: 1,
                migrate: async (persisted, version) => {
                    return persisted as any;
                },
                onRehydrateStorage: () => (state, error) => {
                    if (error) return;
                    setTimeout(() => {
                        usePacemakerQueue.setState({ hydrated: true });
                    }, 0);
                },
            }
        )
    )
);
