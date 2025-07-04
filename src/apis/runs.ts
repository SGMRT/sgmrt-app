import server from "./instance";
import {
    CourseRunning,
    GhostRunning,
    SoloRunGetResponse,
    SoloRunning,
    Telemetry,
} from "./types/run";

export async function postRun(data: SoloRunning, memberId: number) {
    try {
        const response = await server.post(`runs/${memberId}`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function postCourseRun(
    data: CourseRunning | GhostRunning,
    courseId: number,
    memberId: number
) {
    try {
        const response = await server.post(
            `runs/${courseId}/${memberId}`,
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
