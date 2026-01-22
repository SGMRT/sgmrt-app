import { Platform } from "react-native";
import * as Device from "expo-device";

export type RecordingPreset = "high" | "medium" | "low";

export type RecordingConfig = {
    targetWidth: number;
    targetHeight: number;
    initialQuality: number;
    minQuality: number;
    maxQuality: number;
    base64BytesBudget: number;
    visualFps: number;
};

const PRESETS: Record<RecordingPreset, RecordingConfig> = {
    high: {
        targetWidth: 393,
        targetHeight: 586,
        initialQuality: 0.18,
        minQuality: 0.12,
        maxQuality: 0.25,
        base64BytesBudget: 150 * 1024 * 1024,
        visualFps: 24,
    },
    medium: {
        targetWidth: 320,
        targetHeight: 478,
        initialQuality: 0.15,
        minQuality: 0.1,
        maxQuality: 0.2,
        base64BytesBudget: 100 * 1024 * 1024,
        visualFps: 20,
    },
    low: {
        targetWidth: 256,
        targetHeight: 382,
        initialQuality: 0.12,
        minQuality: 0.08,
        maxQuality: 0.15,
        base64BytesBudget: 60 * 1024 * 1024,
        visualFps: 15,
    },
};

/**
 * 구형 iOS 기기 패턴 매칭
 * iPhone 6, 7, 8, SE(1세대), X (XS 제외)
 */
const OLD_IPHONE_PATTERN = /iPhone\s?(6|7|8|SE|X(?!S|R))/i;

/**
 * 기기 능력에 따른 녹화 설정 결정
 */
export function getRecordingConfig(): RecordingConfig {
    const totalMemory = Device.totalMemory ?? 0;
    const modelName = Device.modelName ?? "";

    // Android: 네이티브 인코더 미구현으로 보수적 설정
    if (Platform.OS === "android") {
        return PRESETS.low;
    }

    // 구형 iOS 기기
    if (OLD_IPHONE_PATTERN.test(modelName)) {
        return PRESETS.low;
    }

    // RAM 3GB 미만
    if (totalMemory < 3 * 1024 * 1024 * 1024) {
        return PRESETS.low;
    }

    // RAM 3-4GB
    if (totalMemory < 4 * 1024 * 1024 * 1024) {
        return PRESETS.medium;
    }

    // RAM 4GB 이상
    return PRESETS.high;
}

/**
 * 현재 기기의 녹화 프리셋 이름 반환 (디버깅/로깅용)
 */
export function getRecordingPresetName(): RecordingPreset {
    const totalMemory = Device.totalMemory ?? 0;
    const modelName = Device.modelName ?? "";

    if (Platform.OS === "android") {
        return "low";
    }

    if (OLD_IPHONE_PATTERN.test(modelName)) {
        return "low";
    }

    if (totalMemory < 3 * 1024 * 1024 * 1024) {
        return "low";
    }

    if (totalMemory < 4 * 1024 * 1024 * 1024) {
        return "medium";
    }

    return "high";
}

/**
 * 품질 값을 설정 범위 내로 제한
 */
export function clampQuality(
    quality: number,
    config: RecordingConfig
): number {
    return Math.max(config.minQuality, Math.min(config.maxQuality, quality));
}
