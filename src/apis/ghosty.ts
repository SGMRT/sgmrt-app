import { AxiosError, isAxiosError } from "axios";
import server from "./instance";
import { CustomError } from "./types/common";
import {
    CreateGhostyRequest,
    GhostyRateLimitResponse,
    PacemakerByCourseIdResponse,
    PacemakerDetailResponse,
    VDOTLevel,
    VDOTRespose,
} from "./types/ghosty";
import { handleError } from "./utils";

export async function getVDOTInfo(): Promise<VDOTRespose> {
    try {
        const response = await server.get("members/vdot");
        return {
            valid: true,
            value: response.data,
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
            return {
                valid: false,
                value: 0,
            };
        }
        throw error;
    }
}

export async function postVDOTInfo(level: VDOTLevel): Promise<void> {
    try {
        await server.post("members/vdot", { level });
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 400) {
            throw error.response.data as CustomError;
        } else if (
            error instanceof AxiosError &&
            error.response?.status === 409
        ) {
            return;
        }
        throw error;
    }
}

export async function getGhostyRateLimit(): Promise<GhostyRateLimitResponse> {
    try {
        const response = await server.get("pacemaker/rate-limit");
        return {
            count: response.data,
        };
    } catch (error) {
        throw error;
    }
}

export async function postGhosty(request: CreateGhostyRequest) {
    try {
        const response = await server.post("pacemaker", request);
        return {
            pacemakerId: response.data,
        };
    } catch (error) {
        throw handleError(error);
    }
}

export async function getPacemakerByCourseId(
    courseId: number
): Promise<PacemakerByCourseIdResponse | null> {
    try {
        const response = await server.get("pacemaker", {
            params: { courseId },
        });
        return response.data;
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw handleError(error);
    }
}

export async function getPacemakerDetail(
    pacemakerId: number
): Promise<PacemakerDetailResponse> {
    try {
        const response = await server.get(`pacemaker/${pacemakerId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function deletePacemaker(pacemakerId: number): Promise<void> {
    try {
        await server.delete(`pacemaker/${pacemakerId}`);
    } catch (error) {
        throw handleError(error);
    }
}

export async function markPacemakerAsRun(
    pacemakerId: number,
    runningId: number
): Promise<void> {
    try {
        await server.patch(`pacemaker/after-running`, {
            pacemakerId,
            runningId,
        });
    } catch (error) {
        throw handleError(error);
    }
}
