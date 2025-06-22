const getTopCoordinate = (coords: [number, number][]): [number, number] => {
    return coords.reduce(
        (maxPt, pt) => (pt[1] > maxPt[1] ? pt : maxPt),
        coords[0]
    );
};

// Haversine 공식 사용
const getDistance = (coord1: [number, number], coord2: [number, number]) => {
    console.log("getDistance", coord1, coord2);
    const R = 6371; // Radius of the earth in km
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

export { getDistance, getTopCoordinate };
