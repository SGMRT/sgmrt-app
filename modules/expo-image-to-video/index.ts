// modules/expo-image-to-video/index.ts
import { requireNativeModule } from "expo-modules-core";
const ExpoImageToVideo = requireNativeModule("ExpoImageToVideo");

export async function createVideo(
    imagePaths: string[],
    outputPath: string,
    fps: number = 30
): Promise<string> {
    return await ExpoImageToVideo.createVideo(imagePaths, outputPath, fps);
}

export async function createVideoFromBase64(
    base64Images: string[], // "data:image/jpeg;base64,...." or pure base64
    outputPath: string,
    fps: number = 30
): Promise<string> {
    return await ExpoImageToVideo.createVideoFromBase64(
        base64Images,
        outputPath,
        fps
    );
}

// 스트리밍 인코더 API - 청크 단위로 프레임 추가 가능
export async function startStreamingEncoder(
    sessionId: string,
    outputPath: string,
    fps: number,
    width: number,
    height: number
): Promise<string> {
    return await ExpoImageToVideo.startStreamingEncoder(
        sessionId,
        outputPath,
        fps,
        width,
        height
    );
}

export async function appendFrames(
    sessionId: string,
    base64Images: string[]
): Promise<boolean> {
    return await ExpoImageToVideo.appendFrames(sessionId, base64Images);
}

export async function finishStreamingEncoder(
    sessionId: string
): Promise<string> {
    return await ExpoImageToVideo.finishStreamingEncoder(sessionId);
}
