export type PacemakerJob = {
    jobId: string;
    pacemakerId: number;
    courseId: number;
    status: "PROCESSING" | "SUCCEED" | "FAILED";
    queuedAt: string;
    updatedAt: string;
    error?: string;
};
