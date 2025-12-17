import { errorLog } from "../utils/devLog";
import { captureError } from "../utils/sentryTools";
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
        errorLog(error);
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
    } catch (error) {
        captureError("apis.common.getDataFromS3", error, { url });
        errorLog("S3 데이터 가져오기 실패: " + url);
        return undefined;
    }
}

export async function parseJsonl(data: string) {
    const lines = data.trim().split("\n");

    const parsedData = lines
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                captureError("apis.common.parseJsonl", error, { line });
                errorLog("JSONL 파싱 실패: " + line);
                return null;
            }
        })
        .filter((item) => item !== null);

    return parsedData;
}
