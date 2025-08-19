import { useAuthStore } from "../store/authState";
import { getDataFromS3, parseJsonl } from "./common";
import server from "./instance";
import {
    CourseDetailResponse,
    CourseResponse,
    CoursesRequest,
    HistoryResponse,
    Pageable,
    UserCourseInfo,
} from "./types/course";
import { Telemetry } from "./types/run";
import { attachTelemetries, getUpdateAttrs } from "./utils";

export async function deleteCourse(courseId: number) {
    try {
        const response = await server.delete(`courses/${courseId}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function patchCourseName(
    courseId: number,
    name: string,
    isPublic: boolean
) {
    const updateAttrs = getUpdateAttrs({
        name,
        isPublic,
    });
    try {
        const response = await server.patch(`courses/${courseId}`, {
            name,
            isPublic,
            updateAttrs,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCourses(
    request: CoursesRequest
): Promise<CourseResponse[]> {
    try {
        const response = await server.get("/courses", {
            params: request,
        });
        const responseData = response.data as CourseResponse[];
        const filteredResponseData = responseData.filter(
            (course) => course.routeUrl !== null
        );
        return await attachTelemetries(filteredResponseData);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCourse(
    courseId: number
): Promise<CourseDetailResponse> {
    try {
        const response = await server.get(`/courses/${courseId}`);
        const telemetryUrl: string | undefined = response.data?.telemetryUrl;

        let telemetries: Telemetry[] = [];
        if (telemetryUrl) {
            const text = await getDataFromS3(telemetryUrl);
            if (text) {
                const parsed = await parseJsonl(text);
                telemetries = (parsed as unknown as Telemetry[]) ?? [];
            }
        }

        return { ...response.data, telemetries };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCourseTopRanking({
    courseId,
    count,
}: {
    courseId: number;
    count: number;
}): Promise<HistoryResponse[]> {
    try {
        const response = await server.get(`/courses/${courseId}/top-ranking`, {
            params: { count },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCourseUserRank({
    courseId,
    memberUuid,
}: {
    courseId: number;
    memberUuid: string;
}): Promise<HistoryResponse> {
    try {
        const response = await server.get(`/courses/${courseId}/ranking`, {
            params: { memberUuid },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getCourseGhosts({
    courseId,
    pageable,
}: {
    courseId: number;
    pageable: Pageable;
}): Promise<{
    content: HistoryResponse[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}> {
    try {
        const response = await server.get(`/courses/${courseId}/ghosts`, {
            params: { pageable },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface UserCoursesResponse {
    content: UserCourseInfo[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}

export async function getUserCourses(
    pageable: Pageable
): Promise<UserCoursesResponse> {
    const memberUuid = useAuthStore.getState().uuid;
    if (!memberUuid) {
        throw new Error("Member UUID is not found");
    }
    try {
        const response = await server.get(`/members/${memberUuid}/courses`, {
            params: {
                page: pageable.page,
                size: pageable.size,
                sort: pageable.sort,
            },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
