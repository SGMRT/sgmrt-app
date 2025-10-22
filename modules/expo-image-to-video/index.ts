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
