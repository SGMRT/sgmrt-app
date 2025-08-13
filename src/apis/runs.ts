import { Coordinate } from "../utils/mapUtils";
import server from "./instance";
import {
    RecordInfo,
    RunResponse,
    RunsRequest,
    SoloRunGetResponse,
    Telemetry,
} from "./types/run";

export async function postRun(data: FormData) {
    try {
        const response = await server.post(`runs`, data, {
            formData: true,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function postCourseRun(data: FormData, courseId: number) {
    try {
        const response = await server.post(`runs/courses/${courseId}`, data, {
            formData: true,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function patchRunName(runningId: number, name: string) {
    try {
        const response = await server.patch(`runs/${runningId}/name`, {
            name,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function patchRunIsPublic(runningId: number) {
    try {
        const response = await server.patch(`runs/${runningId}/isPublic`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRun(runningId: number): Promise<SoloRunGetResponse> {
    try {
        const response = await server.get(`runs/${runningId}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRunTelemetries(
    runningId: number
): Promise<Telemetry[]> {
    if (runningId === -1) {
        return [];
    }
    try {
        const response = await server.get(`runs/${runningId}/telemetries`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
type RunInfo = {
    nickname: string;
    profileUrl: string;
    recordInfo: RecordInfo;
};
export interface RunComperisonResponse {
    startedAt: number;
    runningName: string;
    telemetries: Telemetry[];
    courseInfo: {
        id: number;
        name: string;
        isPublic: boolean;
        runnerCount: number;
    };
    myRunInfo: RunInfo;
    ghostRunInfo: RunInfo;
    comparisonInfo: {
        distance: number;
        duration: number;
        cadence: number;
        pace: number;
    };
}

export async function getRunComperison(
    myRunningId: number,
    ghostRunningId: number
): Promise<RunComperisonResponse> {
    try {
        const response = await server.get(
            `runs/${myRunningId}/ghosts/${ghostRunningId}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function toggleRunPublicStatus(runningId: number) {
    try {
        const response = await server.patch(`runs/${runningId}/public`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRunTelemetriesByCourseId(courseId: number): Promise<{
    name: string;
    coordinates: Coordinate[];
}> {
    try {
        const response = await server.get(
            `courses/${courseId}/first-telemetry`
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteRun(runningId: number) {
    try {
        const response = await server.delete(`runs`, {
            data: {
                runningIds: [runningId],
            },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getRuns(request: RunsRequest): Promise<RunResponse[]> {
    try {
        const response = await server.get(`runs`, {
            params: request,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
