import colors from "./colors";

export const mapboxStyles = {
    activeLineLayer: {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: 2,
        lineEmissiveStrength: 1,
        lineColor: colors.primary,
    },
    inactiveLineLayer: {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: 3,
        lineEmissiveStrength: 1,
        lineColor: colors.white,
    },
    activeCircle: {
        circleRadius: 4,
        circleColor: colors.primary,
        circleEmissiveStrength: 1,
    },
    inactiveCircle: {
        circleRadius: 4,
        circleColor: colors.white,
        circleEmissiveStrength: 1,
    },
};
