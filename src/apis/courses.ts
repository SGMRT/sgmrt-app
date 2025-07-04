import server from "./instance";
import { CourseResponse, CoursesRequest } from "./types/course";

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
