/**
 * Skia Canvas에 통계 오버레이를 렌더링하는 유틸리티
 *
 * 거리, 페이스, 시간 등의 통계를 화면에 표시합니다.
 */

import { Skia, SkCanvas } from "@shopify/react-native-skia";
import { ReplayStats } from "../types";

type StatsStyle = {
    primaryFontSize: number;
    secondaryFontSize: number;
    labelFontSize: number;
    primaryColor: string;
    secondaryColor: string;
    labelColor: string;
    backgroundColor: string;
    padding: number;
    borderRadius: number;
};

const DEFAULT_STYLE: StatsStyle = {
    primaryFontSize: 48,
    secondaryFontSize: 24,
    labelFontSize: 12,
    primaryColor: "#FFFFFF",
    secondaryColor: "#00FF88",
    labelColor: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
    borderRadius: 12,
};

/**
 * 페이스를 문자열로 포맷팅 (초 → M'SS")
 */
export function formatPace(secPerKm: number | null | undefined): string {
    if (!secPerKm || secPerKm <= 0 || !Number.isFinite(secPerKm)) {
        return "-'-\"";
    }
    const minutes = Math.floor(secPerKm / 60);
    const seconds = Math.floor(secPerKm % 60);
    return `${minutes}'${seconds.toString().padStart(2, "0")}"`;
}

/**
 * 거리를 문자열로 포맷팅 (미터 → km)
 */
export function formatDistance(meters: number): string {
    const km = meters / 1000;
    return km.toFixed(2);
}

/**
 * 시간을 문자열로 포맷팅 (밀리초 → HH:MM:SS 또는 MM:SS)
 */
export function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * 케이던스를 문자열로 포맷팅
 */
export function formatCadence(spm: number | null | undefined): string {
    if (!spm || spm <= 0 || !Number.isFinite(spm)) {
        return "--";
    }
    return Math.round(spm).toString();
}

type StatsLayout = "top" | "bottom" | "overlay";

type DrawStatsOptions = {
    layout?: StatsLayout;
    style?: Partial<StatsStyle>;
    showDistance?: boolean;
    showPace?: boolean;
    showTime?: boolean;
    showCadence?: boolean;
};

/**
 * Skia Canvas에 통계 오버레이를 그리는 함수
 */
export function drawStatsOnCanvas(
    canvas: SkCanvas,
    stats: ReplayStats,
    width: number,
    height: number,
    options: DrawStatsOptions = {}
): void {
    const {
        layout = "bottom",
        style = {},
        showDistance = true,
        showPace = true,
        showTime = true,
        showCadence = false,
    } = options;

    const mergedStyle = { ...DEFAULT_STYLE, ...style };

    // 폰트 생성 (시스템 기본 폰트 사용)
    const primaryFont = Skia.Font(undefined, mergedStyle.primaryFontSize);
    const secondaryFont = Skia.Font(undefined, mergedStyle.secondaryFontSize);
    const labelFont = Skia.Font(undefined, mergedStyle.labelFontSize);

    // 표시할 통계 항목 계산
    const items: { label: string; value: string; unit: string; isPrimary: boolean }[] = [];

    if (showDistance) {
        items.push({
            label: "거리",
            value: formatDistance(stats.distanceM),
            unit: "km",
            isPrimary: true,
        });
    }

    if (showTime) {
        items.push({
            label: "시간",
            value: formatTime(stats.elapsedMs),
            unit: "",
            isPrimary: false,
        });
    }

    if (showPace) {
        items.push({
            label: "페이스",
            value: formatPace(stats.paceSec),
            unit: "/km",
            isPrimary: false,
        });
    }

    if (showCadence) {
        items.push({
            label: "케이던스",
            value: formatCadence(stats.cadenceSpm),
            unit: "spm",
            isPrimary: false,
        });
    }

    // 레이아웃에 따른 위치 계산
    const padding = mergedStyle.padding;
    let startY: number;

    switch (layout) {
        case "top":
            startY = padding + 60; // Safe area 고려
            break;
        case "bottom":
            startY = height - padding - 120;
            break;
        case "overlay":
        default:
            startY = height - padding - 180;
            break;
    }

    // 배경 박스 그리기
    const boxHeight = 100;
    const boxPaint = Skia.Paint();
    boxPaint.setColor(Skia.Color(mergedStyle.backgroundColor));
    boxPaint.setAntiAlias(true);

    const boxRect = Skia.RRectXY(
        Skia.XYWHRect(padding, startY, width - padding * 2, boxHeight),
        mergedStyle.borderRadius,
        mergedStyle.borderRadius
    );
    canvas.drawRRect(boxRect, boxPaint);

    // 통계 항목 그리기
    const itemWidth = (width - padding * 2) / items.length;

    items.forEach((item, index) => {
        const centerX = padding + itemWidth * index + itemWidth / 2;

        // 라벨
        const labelPaint = Skia.Paint();
        labelPaint.setColor(Skia.Color(mergedStyle.labelColor));
        labelPaint.setAntiAlias(true);

        const labelText = item.label;
        const labelWidth = labelFont.measureText(labelText).width;
        canvas.drawText(
            labelText,
            centerX - labelWidth / 2,
            startY + 24,
            labelPaint,
            labelFont
        );

        // 값
        const valuePaint = Skia.Paint();
        valuePaint.setColor(
            Skia.Color(
                item.isPrimary ? mergedStyle.primaryColor : mergedStyle.secondaryColor
            )
        );
        valuePaint.setAntiAlias(true);

        const valueFont = item.isPrimary ? primaryFont : secondaryFont;
        const valueText = item.value;
        const valueWidth = valueFont.measureText(valueText).width;
        canvas.drawText(
            valueText,
            centerX - valueWidth / 2,
            startY + (item.isPrimary ? 70 : 60),
            valuePaint,
            valueFont
        );

        // 단위
        if (item.unit) {
            const unitPaint = Skia.Paint();
            unitPaint.setColor(Skia.Color(mergedStyle.labelColor));
            unitPaint.setAntiAlias(true);

            const unitText = item.unit;
            const unitWidth = labelFont.measureText(unitText).width;
            canvas.drawText(
                unitText,
                centerX - unitWidth / 2,
                startY + 88,
                unitPaint,
                labelFont
            );
        }
    });
}

/**
 * 간단한 거리+시간 오버레이 (미니멀 버전)
 */
export function drawMinimalStatsOnCanvas(
    canvas: SkCanvas,
    distanceM: number,
    elapsedMs: number,
    width: number,
    height: number,
    options: { style?: Partial<StatsStyle> } = {}
): void {
    const mergedStyle = { ...DEFAULT_STYLE, ...options.style };

    const primaryFont = Skia.Font(undefined, mergedStyle.primaryFontSize);
    const labelFont = Skia.Font(undefined, mergedStyle.labelFontSize);

    const distance = formatDistance(distanceM);
    const time = formatTime(elapsedMs);

    const padding = mergedStyle.padding;
    const y = height - padding - 80;

    // 거리 (왼쪽)
    const distancePaint = Skia.Paint();
    distancePaint.setColor(Skia.Color(mergedStyle.primaryColor));
    distancePaint.setAntiAlias(true);

    canvas.drawText(distance, padding, y, distancePaint, primaryFont);

    const kmPaint = Skia.Paint();
    kmPaint.setColor(Skia.Color(mergedStyle.labelColor));
    kmPaint.setAntiAlias(true);

    const distanceWidth = primaryFont.measureText(distance).width;
    canvas.drawText("km", padding + distanceWidth + 4, y, kmPaint, labelFont);

    // 시간 (오른쪽)
    const timePaint = Skia.Paint();
    timePaint.setColor(Skia.Color(mergedStyle.secondaryColor));
    timePaint.setAntiAlias(true);

    const timeWidth = primaryFont.measureText(time).width;
    canvas.drawText(time, width - padding - timeWidth, y, timePaint, primaryFont);
}

/**
 * 프로그레스 바 그리기
 */
export function drawProgressBarOnCanvas(
    canvas: SkCanvas,
    progress: number,
    width: number,
    height: number,
    options: {
        y?: number;
        barHeight?: number;
        backgroundColor?: string;
        progressColor?: string;
        padding?: number;
    } = {}
): void {
    const {
        y = height - 8,
        barHeight = 4,
        backgroundColor = "rgba(255, 255, 255, 0.2)",
        progressColor = "#00FF88",
        padding = 16,
    } = options;

    const barWidth = width - padding * 2;
    const progressWidth = barWidth * Math.max(0, Math.min(1, progress));

    // 배경
    const bgPaint = Skia.Paint();
    bgPaint.setColor(Skia.Color(backgroundColor));
    bgPaint.setAntiAlias(true);

    canvas.drawRRect(
        Skia.RRectXY(Skia.XYWHRect(padding, y, barWidth, barHeight), 2, 2),
        bgPaint
    );

    // 진행률
    if (progressWidth > 0) {
        const progressPaint = Skia.Paint();
        progressPaint.setColor(Skia.Color(progressColor));
        progressPaint.setAntiAlias(true);

        canvas.drawRRect(
            Skia.RRectXY(Skia.XYWHRect(padding, y, progressWidth, barHeight), 2, 2),
            progressPaint
        );
    }
}

/**
 * 통계 스타일 프리셋
 */
export const STATS_STYLE_PRESETS = {
    default: DEFAULT_STYLE,
    dark: {
        ...DEFAULT_STYLE,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    light: {
        ...DEFAULT_STYLE,
        primaryColor: "#000000",
        secondaryColor: "#007AFF",
        labelColor: "rgba(0, 0, 0, 0.6)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    transparent: {
        ...DEFAULT_STYLE,
        backgroundColor: "transparent",
    },
} as const;
