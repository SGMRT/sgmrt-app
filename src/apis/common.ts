import server from "./instance";
import { GetPresignedUrlRequest } from "./types/common";

export async function getPresignedUrl(data: GetPresignedUrlRequest) {
    try {
        const response = await server.get(`/presigned-url`, {
            params: data,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
