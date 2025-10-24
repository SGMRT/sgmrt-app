import { RunSet } from "@/src/apis/types/ghosty";

/** pace 범위(min, max) — 결과 동일 보장 (원본 로직 그대로) */
export const getPaceRange = (sets: RunSet[]): [number, number] => {
    const minP = sets.reduce((acc, s) => Math.min(acc, s.pace), Infinity);
    const maxP = sets.reduce((acc, s) => Math.max(acc, s.pace), -Infinity);
    return [minP, maxP];
};

/** 페이스 → 높이(빠를수록 높게) — 원본과 동일한 보간/반올림 */
export const heightForPace = (
    pace: number,
    [minP, maxP]: [number, number],
    minBarHeight: number,
    maxBarHeight: number
) => {
    if (maxP === minP) return Math.round((minBarHeight + maxBarHeight) / 2);
    // pace가 작을수록(빠를수록) t가 1에 가까워짐
    const t = Math.max(0, Math.min(1, (maxP - pace) / (maxP - minP)));
    return Math.round(minBarHeight + (maxBarHeight - minBarHeight) * t);
};

/** 시간(분) 기반 너비 분배 — 원본 로직 1:1 유지
 * - warmUpMinutes, maintenanceMinutes, coolDownMinutes 사용
 * - 메인: 세트에 minutes가 있으면 그 비율대로, 없으면 균등 분배
 */
export function computePhaseTimes(params: {
    sets: RunSet[];
    timeTable: {
        warmUpMinutes: number;
        maintenanceMinutes: number;
        coolDownMinutes: number;
    };
}) {
    const { sets, timeTable } = params;
    const warmMin = Math.max(0, timeTable.warmUpMinutes);
    const coolMin = Math.max(0, timeTable.coolDownMinutes);
    const totalMain = Math.max(0, timeTable.maintenanceMinutes);

    const mains = sets.slice(1, -1);
    let mainMins: number[] = [];

    if (mains.length === 0) {
        mainMins = [];
    } else {
        const hasPerSetMinutes = mains.every(
            (s) =>
                typeof (s as any)?.minutes === "number" &&
                (s as any).minutes > 0
        );
        if (hasPerSetMinutes) {
            const raw = mains.map((s) => (s as any).minutes as number);
            const sum = raw.reduce((a, b) => a + b, 0);
            mainMins = raw.map((m) => (sum > 0 ? (m / sum) * totalMain : 0));
        } else {
            const each = totalMain / mains.length;
            mainMins = mains.map(() => each);
        }
    }

    const totalMin = warmMin + coolMin + mainMins.reduce((a, b) => a + b, 0);
    return { warmMin, mainMins, coolMin, totalMin };
}
