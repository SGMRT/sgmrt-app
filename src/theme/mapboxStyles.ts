import colors from "./colors";

export const mapboxStyles = {
    activeLineLayer: {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: 2,
        lineEmissiveStrength: 1,
        lineColor: colors.primary,
        lineOpacity: 1,
    },
    inactiveLineLayer: {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: 2,
        lineEmissiveStrength: 1,
        lineColor: colors.white,
        lineOpacity: 0.5,
    },
    activeCircle: {
        circleRadius: 4,
        circleColor: colors.primary,
        circleEmissiveStrength: 1,
        circleOpacity: 1,
    },
    inactiveCircle: {
        circleRadius: 4,
        circleColor: colors.white,
        circleEmissiveStrength: 1,
        circleOpacity: 0.5,
    },
};
