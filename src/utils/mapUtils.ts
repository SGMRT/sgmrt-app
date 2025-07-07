import { Dimensions } from "react-native";
import { CourseResponse } from "../apis/types/course";
import { Telemetry } from "../apis/types/run";

export interface Coordinate {
    lat: number;
    lng: number;
}

const getTopCoordinate = (coords: Coordinate[]): Coordinate => {
    return coords.reduce(
        (maxPt, pt) => (pt.lat > maxPt.lat ? pt : maxPt),
        coords[0]
    );
};

// Haversine 공식 사용
const getDistance = (coord1: Coordinate, coord2: Coordinate) => {
    const R = 6371000;
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLon = (coord2.lng - coord1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * (Math.PI / 180)) *
            Math.cos(coord2.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateCenter = (coordinates: Coordinate[]) => {
    const minX = Math.min(...coordinates.map((coord) => coord.lat));
    const minY = Math.min(...coordinates.map((coord) => coord.lng));
    const maxX = Math.max(...coordinates.map((coord) => coord.lat));
    const maxY = Math.max(...coordinates.map((coord) => coord.lng));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    // 가로 길이, 세로 길이 중 더 긴쪽을 출력
    const width = maxX - minX;
    const height = maxY - minY;
    const size = width > height ? width : height;
    return { latitude: centerX, longitude: centerY, size: size };
};

const convertTelemetriesToCourse = (
    telemetries: Telemetry[]
): CourseResponse => {
    return {
        id: 0,
        name: "",
        startLat: telemetries[0].lat,
        startLng: telemetries[0].lng,
        pathData: telemetries.map((telemetry) => ({
            lat: telemetry.lat,
            lng: telemetry.lng,
        })),
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0,
    };
};

const calculateZoomLevelFromSize = (
    sizeInDegrees: number,
    centerLat: number
) => {
    // 위도에 따라 조정된 meters per degree (경도 기준)
    const meters =
        sizeInDegrees * 111320 * Math.cos((centerLat * Math.PI) / 180); // 경도 → 미터

    // Mapbox 기준 zoom 0에서 1px당 거리
    const metersPerPixelAtZoom0 = 156543.03392;

    const screenWidth = Dimensions.get("window").width;

    const zoomLevel = Math.log2((metersPerPixelAtZoom0 * screenWidth) / meters);

    return zoomLevel - 2;
};

export {
    calculateCenter,
    calculateZoomLevelFromSize,
    convertTelemetriesToCourse,
    getDistance,
    getTopCoordinate,
};
