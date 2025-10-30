export const uid = (p = "id") =>
    `${p}_${Math.random().toString(36).slice(2, 9)}`;

export function toClock(angle?: number | null) {
    if (angle == null || Number.isNaN(angle)) return "정면";
    const a = ((angle % 360) + 360) % 360;
    const idx = Math.floor((a + 15) / 30) % 12;
    return (
        [
            "12시",
            "1시",
            "2시",
            "3시",
            "4시",
            "5시",
            "6시",
            "7시",
            "8시",
            "9시",
            "10시",
            "11시",
        ][idx] + " 방향"
    );
}

export function splitHMS(totalSec: number) {
    const h = Math.floor(totalSec / 3600),
        m = Math.floor((totalSec % 3600) / 60),
        s = Math.floor(totalSec % 60);
    return h > 0 ? `${h}시간 ${m}분 ${s}초` : `${m}분 ${s}초`;
}
export function splitPace(secPerKm: number) {
    const m = Math.floor(secPerKm / 60),
        s = Math.max(0, Math.floor(secPerKm % 60));
    return `${m}분 ${s}초`;
}
export function summary(
    totalTime: number,
    totalDistance: number,
    avgPace: number | null,
    totalCalories: number | null
) {
    const timeText = `시간 ${splitHMS(totalTime)} `;
    const distanceText = `거리 ${(totalDistance / 1000).toFixed(2)}km `;
    const paceText = `평균 페이스 ${splitPace(avgPace ?? 0)} `;
    const caloriesText = totalCalories
        ? `소모칼로리 ${totalCalories} 칼로리 `
        : "";
    return { timeText, distanceText, paceText, caloriesText };
}
export function kmTick(
    distanceKM: string,
    totalTime: number,
    avgPace: number | null,
    totalCalories: number | null
) {
    return {
        distOnly: `거리 ${distanceKM}km`,
        timeOnly: ` 시간 ${splitHMS(totalTime)} `,
        paceOnly: ` 평균 페이스 ${splitPace(avgPace ?? 0)} `,
        calOnly: totalCalories
            ? ` 소모칼로리 ${totalCalories} 칼로리 입니다.`
            : "",
    };
}

// \s*(?<=[\.!\?]|…|。|！|？)\s+
// - (?<= … ) 긍정 후방탐색: 직전 문자가 마침표류(. ! ? …, CJK: 。！？)인지 확인만 하고, 분리 시 구두점은 보존
// - 앞뒤 공백을 흡수하여 깔끔한 문장 경계
export function splitSentencesKorean(script: string): string[] {
    const clean = script.replace(/\s+/g, " ").trim();
    if (!clean) return [];
    return clean
        .split(/\s*(?<=[\.!\?]|…|。|！|？)\s+/u)
        .map((s) => s.trim())
        .filter(Boolean);
}
