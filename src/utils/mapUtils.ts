function getTopCoordinate(coords: [number, number][]): [number, number] {
    return coords.reduce(
        (maxPt, pt) => (pt[1] > maxPt[1] ? pt : maxPt),
        coords[0]
    );
}

export { getTopCoordinate };
