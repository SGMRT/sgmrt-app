import server from "./instance";
import {
    GetPresignedUrlRequest,
    GetPresignedUrlResponse,
} from "./types/common";

export async function getPresignedUrl(
    data: GetPresignedUrlRequest
): Promise<GetPresignedUrlResponse> {
    try {
        const response = await server.get(`common/presign-url`, {
            params: data,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function uploadToS3(fileUri: string, presignedUrl: string) {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
            "Content-Type": blob.type || "image/jpeg",
        },
        body: blob,
    });

    return uploadResponse.ok;
}
