export const normalizeTimestamps = (telemetries: any[]) => {
    if (!telemetries.length) return telemetries;

    // 앞부분 일부만 샘플링해서 단위 추정
    const sampleCount = Math.min(telemetries.length - 1, 10);
    let deltas: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
        const a = telemetries[i];
        const b = telemetries[i + 1];
        if (
            a &&
            b &&
            typeof a.timeStamp === "number" &&
            typeof b.timeStamp === "number"
        ) {
            deltas.push(Math.abs(b.timeStamp - a.timeStamp));
        }
    }

    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length || 0;

    // 평균 Δt가 10 미만이면 sec 단위라고 판단
    const isSecondUnit = avgDelta < 10;

    if (isSecondUnit) {
        return telemetries.map((t) => ({
            ...t,
            timeStamp: t.timeStamp * 1000,
        }));
    }

    return telemetries;
};
