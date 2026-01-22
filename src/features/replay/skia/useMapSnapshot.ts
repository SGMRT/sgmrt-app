/**
 * Mapbox Static Images API를 사용하여 정적 지도 이미지를 가져오는 훅
 *
 * 경로의 bounds를 계산하여 전체 경로가 보이는 지도 이미지를 생성합니다.
 */

import { useImage } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Sample } from "../types";

export type MapBounds = {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
    centerLng: number;
    centerLat: number;
};

type UseMapSnapshotOptions = {
    width: number;
    height: number;
    padding?: number; // 경로 주변 여백 (0~1)
    style?: string; // Mapbox 스타일
    pitch?: number;
    bearing?: number;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "";

/**
 * 경로 샘플에서 bounds 계산
 */
export function calculateBounds(samples: Sample[]): MapBounds | null {
    if (samples.length === 0) return null;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const sample of samples) {
        minLng = Math.min(minLng, sample.x);
        maxLng = Math.max(maxLng, sample.x);
        minLat = Math.min(minLat, sample.y);
        maxLat = Math.max(maxLat, sample.y);
    }

    return {
        minLng,
        maxLng,
        minLat,
        maxLat,
        centerLng: (minLng + maxLng) / 2,
        centerLat: (minLat + maxLat) / 2,
    };
}

/**
 * bounds에서 적절한 zoom level 계산
 */
function calculateZoom(
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number
): number {
    const lngDiff = bounds.maxLng - bounds.minLng;
    const latDiff = bounds.maxLat - bounds.minLat;

    // 패딩 적용
    const effectiveWidth = width * (1 - padding * 2);
    const effectiveHeight = height * (1 - padding * 2);

    // 위도/경도 차이에 따른 zoom 계산
    // 1도 = 약 111km, zoom 0에서 360도 = 256px
    const WORLD_PX = 256;
    const lngZoom = Math.log2((effectiveWidth * 360) / (lngDiff * WORLD_PX));
    const latZoom = Math.log2((effectiveHeight * 180) / (latDiff * WORLD_PX));

    // 둘 중 작은 값 사용 (더 넓은 영역이 보이도록)
    return Math.min(lngZoom, latZoom, 18); // 최대 zoom 18
}

/**
 * Mapbox Static Images API URL 생성
 */
export function buildStaticMapUrl(
    samples: Sample[],
    options: UseMapSnapshotOptions
): string | null {
    const bounds = calculateBounds(samples);
    if (!bounds) return null;

    const {
        width,
        height,
        padding = 0.1,
        style = "mapbox/dark-v11",
        pitch = 0,
        bearing = 0,
    } = options;

    const zoom = calculateZoom(bounds, width, height, padding);

    // @2x for retina
    const url = `https://api.mapbox.com/styles/v1/${style}/static/${bounds.centerLng},${bounds.centerLat},${zoom.toFixed(2)},${bearing},${pitch}/${Math.round(width)}x${Math.round(height)}@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;

    return url;
}

/**
 * 정적 지도 이미지를 Skia Image로 로드하는 훅
 */
export function useMapSnapshot(
    samples: Sample[],
    options: UseMapSnapshotOptions
) {
    const url = useMemo(
        () => buildStaticMapUrl(samples, options),
        [samples, options.width, options.height, options.padding, options.style]
    );

    const image = useImage(url);

    const bounds = useMemo(() => calculateBounds(samples), [samples]);

    return {
        image,
        bounds,
        url,
        isLoading: url !== null && image === null,
    };
}

/**
 * GPS 좌표를 Canvas 좌표로 변환
 */
export function geoToCanvas(
    lng: number,
    lat: number,
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number = 0.1
): { x: number; y: number } {
    const paddedWidth = width * (1 - padding * 2);
    const paddedHeight = height * (1 - padding * 2);
    const offsetX = width * padding;
    const offsetY = height * padding;

    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;

    // 경도는 왼쪽→오른쪽
    const x = offsetX + ((lng - bounds.minLng) / lngRange) * paddedWidth;

    // 위도는 위쪽→아래쪽 (Canvas Y는 아래로 증가)
    const y = offsetY + ((bounds.maxLat - lat) / latRange) * paddedHeight;

    return { x, y };
}

/**
 * 전체 경로를 Canvas 좌표로 변환
 */
export function routeToCanvasPoints(
    samples: Sample[],
    bounds: MapBounds,
    width: number,
    height: number,
    padding: number = 0.1
): { x: number; y: number }[] {
    return samples.map((s) =>
        geoToCanvas(s.x, s.y, bounds, width, height, padding)
    );
}
