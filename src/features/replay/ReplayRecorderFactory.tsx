/**
 * 리플레이 레코더 팩토리
 *
 * 기기 능력 및 Feature Flag에 따라 적절한 레코더를 선택합니다.
 * - Skia: 빠른 GPU 렌더링 (68% 빠름), 신형 기기 권장
 * - ViewShot: 기존 방식, 안정성 높음, 구형 기기/폴백용
 */

import { forwardRef, useMemo } from "react";
import { Platform } from "react-native";
import { Telemetry } from "@/src/apis/types/run";
import { Stat } from "@/src/components/ui";
import ReplayRecorder, { ReplayRecorderHandle } from "./ReplayRecoder";
import SkiaReplayRecorder, { SkiaReplayRecorderHandle } from "./SkiaReplayRecorder";
import { getRecordingConfig } from "./config/recordingConfig";

type RendererType = "viewshot" | "skia" | "auto";

type Props = {
    telemetries: Telemetry[];
    visualFps?: number;
    width?: number;
    height?: number;
    autoShare?: boolean;
    title?: string;
    message?: string;
    name?: string;
    stats?: Stat[];
    distance?: string | number;
    onProgress?: (progress: number) => void;
    onFinish?: () => void;

    // 팩토리 전용 props
    renderer?: RendererType;
    forceRenderer?: RendererType; // 테스트/디버그용 강제 지정
};

export type ReplayRecorderFactoryHandle = ReplayRecorderHandle | SkiaReplayRecorderHandle;

/**
 * 기기 능력에 따라 최적의 렌더러 선택
 */
function selectRenderer(
    preferredRenderer: RendererType,
    forceRenderer?: RendererType
): "viewshot" | "skia" {
    // 강제 지정이 있으면 사용
    if (forceRenderer && forceRenderer !== "auto") {
        return forceRenderer;
    }

    // 명시적 지정이 있으면 사용
    if (preferredRenderer !== "auto") {
        return preferredRenderer;
    }

    // 자동 선택 로직
    const config = getRecordingConfig();

    // iOS만 Skia 지원 (Android는 네이티브 인코더 구현 후 활성화)
    if (Platform.OS !== "ios") {
        return "viewshot";
    }

    // High/Medium 티어 기기는 Skia 사용
    // Low 티어 기기는 ViewShot 폴백 (안정성 우선)
    const tier = config.targetWidth >= 320 ? "high" : "low";

    if (tier === "high") {
        return "skia";
    }

    return "viewshot";
}

/**
 * 렌더러 팩토리 컴포넌트
 */
export default forwardRef<ReplayRecorderFactoryHandle, Props>(function ReplayRecorderFactory(
    {
        renderer = "auto",
        forceRenderer,
        ...restProps
    },
    ref
) {
    const selectedRenderer = useMemo(
        () => selectRenderer(renderer, forceRenderer),
        [renderer, forceRenderer]
    );

    if (selectedRenderer === "skia") {
        return (
            <SkiaReplayRecorder
                ref={ref as React.Ref<SkiaReplayRecorderHandle>}
                {...restProps}
            />
        );
    }

    return (
        <ReplayRecorder
            ref={ref as React.Ref<ReplayRecorderHandle>}
            {...restProps}
        />
    );
});

/**
 * 현재 선택될 렌더러 타입 조회 (디버그/분석용)
 */
export function getSelectedRendererType(
    preferredRenderer: RendererType = "auto",
    forceRenderer?: RendererType
): "viewshot" | "skia" {
    return selectRenderer(preferredRenderer, forceRenderer);
}

/**
 * Skia 렌더러 사용 가능 여부 확인
 */
export function isSkiaRendererAvailable(): boolean {
    // iOS만 지원 (현재)
    return Platform.OS === "ios";
}
