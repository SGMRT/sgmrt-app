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
    return { latitude: centerX, longitude: centerY };
};

export { calculateCenter, getDistance, getTopCoordinate };
