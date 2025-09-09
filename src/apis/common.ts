import * as Sentry from "@sentry/react-native";
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

export async function getDataFromS3(url: string) {
    try {
        const res = await fetch(url);
        return await res.text();
    } catch {
        Sentry.captureException(new Error("S3 데이터 가져오기 실패: " + url));
        console.error("S3 데이터 가져오기 실패: " + url);
        return undefined;
    }
}

export async function parseJsonl(data: string) {
    const lines = data.trim().split("\n");

    const parsedData = lines
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                Sentry.captureException(new Error("JSONL 파싱 실패: " + line));
                console.error("JSONL 파싱 실패: " + line);
                return null;
            }
        })
        .filter((item) => item !== null);

    return parsedData;
}
