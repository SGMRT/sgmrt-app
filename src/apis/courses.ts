import server from "./instance";

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
