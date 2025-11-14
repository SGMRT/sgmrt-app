export const pressureAltitudeM = (
    pMb?: number | null,
    altitude?: number | null
) => {
    if (!pMb || pMb == null) {
        return altitude ?? null;
    }
    return 0.3048 * (145366.45 * (1 - Math.pow(pMb / 1013.25, 0.190284)));
};
