export type PacemakerJob = {
    jobId: string;
    pacemakerId: number;
    courseId: number;
    status: "PROCEEDING" | "COMPLETED" | "FAILED";
    queuedAt: string;
    updatedAt: string;
    error?: string;
};
