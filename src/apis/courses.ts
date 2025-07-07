import server from "./instance";
import { CourseResponse, CoursesRequest, Pageable } from "./types/course";

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
    try {
        console.log(courseId, name, isPublic);
        const response = await server.patch(`courses/${courseId}`, {
            name,
            isPublic,
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
        const response = await server.get("/courses", { params: request });
        return response.data;
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
}) {
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
    userId,
}: {
    courseId: number;
    userId: number;
}) {
    try {
        const response = await server.get(`/courses/${courseId}/ranking`, {
            params: { userId },
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
}) {
    try {
        const response = await server.get(`/courses/${courseId}/ranking`, {
            params: { pageable },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
