/**
 * Skia Canvas에 경로를 렌더링하는 유틸리티
 *
 * 전체 경로와 진행률에 따른 그라데이션을 그립니다.
 */

import { Skia, SkCanvas } from "@shopify/react-native-skia";
import { Sample } from "../types";
import { MapBounds, geoToCanvas } from "./useMapSnapshot";

type RouteStyle = {
    strokeWidth: number;
    baseColor: string; // 아직 지나지 않은 경로 색상
    progressColor: string; // 진행된 경로 색상
    glowColor?: string; // 글로우 효과 색상
    runnerSize: number; // 러너 아이콘 크기
};

const DEFAULT_STYLE: RouteStyle = {
    strokeWidth: 4,
    baseColor: "rgba(255, 255, 255, 0.3)",
    progressColor: "#00FF88",
    glowColor: "rgba(0, 255, 136, 0.4)",
    runnerSize: 8,
};

/**
 * 샘플 배열에서 Skia Path 생성
 */
export function createRoutePath(
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number = 0.1
): ReturnType<typeof Skia.Path.Make> | null {
    if (samples.length < 2) return null;

    const path = Skia.Path.Make();
    const first = geoToCanvas(samples[0].x, samples[0].y, bounds, width, height, padding);
    path.moveTo(first.x, first.y);

    for (let i = 1; i < samples.length; i++) {
        const point = geoToCanvas(samples[i].x, samples[i].y, bounds, width, height, padding);
        path.lineTo(point.x, point.y);
    }

    return path;
}

/**
 * 진행률에 해당하는 샘플 인덱스 계산
 */
export function getProgressIndex(samples: Sample[], progress: number): number {
    if (samples.length === 0) return 0;
    if (progress <= 0) return 0;
    if (progress >= 1) return samples.length - 1;
    return Math.floor(progress * (samples.length - 1));
}

/**
 * 진행률에 해당하는 정확한 위치 계산 (보간)
 */
export function getProgressPosition(
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number,
    progress: number
): { x: number; y: number } {
    if (samples.length === 0) {
        return { x: width / 2, y: height / 2 };
    }

    if (progress <= 0) {
        return geoToCanvas(samples[0].x, samples[0].y, bounds, width, height, padding);
    }

    if (progress >= 1) {
        const last = samples[samples.length - 1];
        return geoToCanvas(last.x, last.y, bounds, width, height, padding);
    }

    const exactIndex = progress * (samples.length - 1);
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.min(lowerIndex + 1, samples.length - 1);
    const t = exactIndex - lowerIndex;

    const lower = geoToCanvas(
        samples[lowerIndex].x,
        samples[lowerIndex].y,
        bounds,
        width,
        height,
        padding
    );
    const upper = geoToCanvas(
        samples[upperIndex].x,
        samples[upperIndex].y,
        bounds,
        width,
        height,
        padding
    );

    return {
        x: lower.x + (upper.x - lower.x) * t,
        y: lower.y + (upper.y - lower.y) * t,
    };
}

/**
 * 진행된 경로 부분만의 Path 생성
 */
export function createProgressPath(
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number,
    progress: number
): ReturnType<typeof Skia.Path.Make> | null {
    if (samples.length < 2 || progress <= 0) return null;

    const progressIndex = getProgressIndex(samples, progress);
    const path = Skia.Path.Make();

    const first = geoToCanvas(samples[0].x, samples[0].y, bounds, width, height, padding);
    path.moveTo(first.x, first.y);

    for (let i = 1; i <= progressIndex; i++) {
        const point = geoToCanvas(samples[i].x, samples[i].y, bounds, width, height, padding);
        path.lineTo(point.x, point.y);
    }

    // 마지막 보간 포인트 추가
    if (progressIndex < samples.length - 1) {
        const pos = getProgressPosition(samples, bounds, width, height, padding, progress);
        path.lineTo(pos.x, pos.y);
    }

    return path;
}

/**
 * 경로 렌더링에 필요한 모든 요소 생성
 */
export function createRouteElements(
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number = 0.1,
    progress: number = 0,
    style: Partial<RouteStyle> = {}
): {
    basePath: ReturnType<typeof Skia.Path.Make> | null;
    progressPath: ReturnType<typeof Skia.Path.Make> | null;
    runnerPosition: { x: number; y: number };
    style: RouteStyle;
} {
    const mergedStyle = { ...DEFAULT_STYLE, ...style };

    const basePath = createRoutePath(samples, bounds, width, height, padding);
    const progressPath = createProgressPath(samples, bounds, width, height, padding, progress);
    const runnerPosition = getProgressPosition(samples, bounds, width, height, padding, progress);

    return {
        basePath,
        progressPath,
        runnerPosition,
        style: mergedStyle,
    };
}

/**
 * Skia Canvas에 경로를 직접 그리는 함수 (imperative API)
 */
export function drawRouteOnCanvas(
    canvas: SkCanvas,
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number = 0.1,
    progress: number = 0,
    style: Partial<RouteStyle> = {}
): void {
    const elements = createRouteElements(
        samples,
        bounds,
        width,
        height,
        padding,
        progress,
        style
    );

    const { basePath, progressPath, runnerPosition, style: mergedStyle } = elements;

    // 1. 베이스 경로 (전체 경로, 반투명)
    if (basePath) {
        const basePaint = Skia.Paint();
        basePaint.setStyle(1); // Stroke
        basePaint.setStrokeWidth(mergedStyle.strokeWidth);
        basePaint.setColor(Skia.Color(mergedStyle.baseColor));
        basePaint.setStrokeCap(1); // Round
        basePaint.setStrokeJoin(1); // Round
        basePaint.setAntiAlias(true);

        canvas.drawPath(basePath, basePaint);
    }

    // 2. 진행된 경로 (글로우 효과)
    if (progressPath && mergedStyle.glowColor) {
        const glowPaint = Skia.Paint();
        glowPaint.setStyle(1); // Stroke
        glowPaint.setStrokeWidth(mergedStyle.strokeWidth + 6);
        glowPaint.setColor(Skia.Color(mergedStyle.glowColor));
        glowPaint.setStrokeCap(1);
        glowPaint.setStrokeJoin(1);
        glowPaint.setAntiAlias(true);

        canvas.drawPath(progressPath, glowPaint);
    }

    // 3. 진행된 경로 (메인)
    if (progressPath) {
        const progressPaint = Skia.Paint();
        progressPaint.setStyle(1); // Stroke
        progressPaint.setStrokeWidth(mergedStyle.strokeWidth);
        progressPaint.setColor(Skia.Color(mergedStyle.progressColor));
        progressPaint.setStrokeCap(1);
        progressPaint.setStrokeJoin(1);
        progressPaint.setAntiAlias(true);

        canvas.drawPath(progressPath, progressPaint);
    }

    // 4. 러너 아이콘 (글로우)
    if (mergedStyle.glowColor) {
        const runnerGlowPaint = Skia.Paint();
        runnerGlowPaint.setStyle(0); // Fill
        runnerGlowPaint.setColor(Skia.Color(mergedStyle.glowColor));
        runnerGlowPaint.setAntiAlias(true);

        canvas.drawCircle(
            runnerPosition.x,
            runnerPosition.y,
            mergedStyle.runnerSize + 4,
            runnerGlowPaint
        );
    }

    // 5. 러너 아이콘 (메인)
    const runnerPaint = Skia.Paint();
    runnerPaint.setStyle(0); // Fill
    runnerPaint.setColor(Skia.Color(mergedStyle.progressColor));
    runnerPaint.setAntiAlias(true);

    canvas.drawCircle(
        runnerPosition.x,
        runnerPosition.y,
        mergedStyle.runnerSize,
        runnerPaint
    );

    // 6. 러너 아이콘 (흰색 테두리)
    const runnerBorderPaint = Skia.Paint();
    runnerBorderPaint.setStyle(1); // Stroke
    runnerBorderPaint.setStrokeWidth(2);
    runnerBorderPaint.setColor(Skia.Color("#FFFFFF"));
    runnerBorderPaint.setAntiAlias(true);

    canvas.drawCircle(
        runnerPosition.x,
        runnerPosition.y,
        mergedStyle.runnerSize,
        runnerBorderPaint
    );
}

/**
 * 경로 스타일 프리셋
 */
export const ROUTE_STYLE_PRESETS = {
    default: DEFAULT_STYLE,
    neon: {
        strokeWidth: 3,
        baseColor: "rgba(100, 100, 255, 0.2)",
        progressColor: "#00FFFF",
        glowColor: "rgba(0, 255, 255, 0.5)",
        runnerSize: 10,
    },
    minimal: {
        strokeWidth: 2,
        baseColor: "rgba(255, 255, 255, 0.2)",
        progressColor: "#FFFFFF",
        glowColor: undefined,
        runnerSize: 6,
    },
    fire: {
        strokeWidth: 4,
        baseColor: "rgba(255, 100, 0, 0.2)",
        progressColor: "#FF6600",
        glowColor: "rgba(255, 100, 0, 0.4)",
        runnerSize: 8,
    },
} as const;
