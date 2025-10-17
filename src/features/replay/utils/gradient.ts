export function buildActiveGradient(progress: number, activeColor: string) {
    const p = Math.max(0, Math.min(1, progress));
    const eps = 1e-6;

    if (p <= 0) {
        return [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            "rgba(0,0,0,0)",
            1,
            "rgba(0,0,0,0)",
        ];
    }

    if (p >= 1) {
        return [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            activeColor,
            1,
            activeColor,
        ];
    }

    const left = Math.max(eps, p - eps);
    if (left >= p) {
        return [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            activeColor,
            p,
            activeColor,
            1,
            "rgba(0,0,0,0)",
        ];
    }

    return [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        activeColor,
        left,
        activeColor,
        p,
        "rgba(0,0,0,0)",
        1,
        "rgba(0,0,0,0)",
    ];
}
