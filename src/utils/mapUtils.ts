const getTopCoordinate = (coords: [number, number][]): [number, number] => {
    return coords.reduce(
        (maxPt, pt) => (pt[1] > maxPt[1] ? pt : maxPt),
        coords[0]
    );
};

// Haversine 공식 사용
const getDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371000;
    const dLat = (coord2[1] - coord1[1]) * (Math.PI / 180);
    const dLon = (coord2[0] - coord1[0]) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[1] * (Math.PI / 180)) *
            Math.cos(coord2[1] * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateCenter = (coordinates: [number, number][]) => {
    const minX = Math.min(...coordinates.map((coord) => coord[0]));
    const minY = Math.min(...coordinates.map((coord) => coord[1]));
    const maxX = Math.max(...coordinates.map((coord) => coord[0]));
    const maxY = Math.max(...coordinates.map((coord) => coord[1]));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    return [centerX, centerY];
};

export { calculateCenter, getDistance, getTopCoordinate };
