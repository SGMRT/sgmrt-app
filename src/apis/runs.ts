import server from "./instance";
import {
    BaseRunning,
    CourseGhostRunning,
    CourseSoloRunning,
    SoloRunGetResponse,
    Telemetry,
} from "./types/run";

export async function postRun(data: BaseRunning, memberId: number) {
    try {
        const response = await server.post(`runs/${memberId}`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function postCourseRun(
    data: CourseSoloRunning | CourseGhostRunning,
    courseId: number,
    memberId: number
) {
    try {
        const response = await server.post(
            `runs/courses/${courseId}/${memberId}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function patchRunName(
    runningId: number,
    name: string,
    memberId: number
) {
    try {
        const response = await server.patch(
            `runs/${runningId}/name/${memberId}`,
            {
                name,
            }
        );
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

export async function getRunComperison(
    myRunningId: number,
    ghostRunningId: number
) {
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

export async function getRunTelemetriesByCourseId(courseId: number) {
    try {
        const response = await server.get(
            `runs/courses/${courseId}/telemetries`
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
