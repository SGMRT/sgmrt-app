import { getDataFromS3, parseJsonl } from "./common";
import { CourseResponse } from "./types/course";
import { Telemetry, TelemetryCompact } from "./types/run";

export function camelToSnakeCase(str: string) {
    return str.replace(/([A-Z])/g, "_$1").toUpperCase();
}

export function getUpdateAttrs(data: any) {
    return Object.keys(data).map((key) => camelToSnakeCase(key));
}

export async function attachTelemetries(
    filteredResponseData: CourseResponse[]
): Promise<CourseResponse[]> {
    await Promise.all(
        filteredResponseData.map(async (course) => {
            const telemetryUrl = course.routeUrl;
            if (!telemetryUrl) {
                course.telemetries = [];
                return;
            }
            try {
                const text = await getDataFromS3(telemetryUrl);
                if (!text) {
                    course.telemetries = [];
                    return;
                }
                const parsed = await parseJsonl(text); // any
                console.log(parsed);
                course.telemetries = decodeTelemetries(
                    normalizeTelemetries(parsed)
                );
                console.log(course.telemetries);
            } catch (err) {
                console.error("Failed to load telemetries for", course.id, err);
                course.telemetries = [];
            }
        })
    );

    return filteredResponseData;
}

function normalizeTelemetries(parsed: any): TelemetryCompact[] {
    if (!Array.isArray(parsed)) return [];

    // [[...]] 또는 [[[...]]] 같은 케이스를 1레벨씩 풀어서
    // 첫 원소가 배열이 아닐 때까지 평탄화
    let arr: any[] = parsed;
    while (Array.isArray(arr[0])) {
        arr = arr.flat(1);
    }

    // lat/lng 유효한 것만 필터
    return arr.filter(
        (p) => p && typeof p.x === "number" && typeof p.y === "number"
    );
}

// 소수점 n 자리수까지 표현, 현재 소수점 자리수가 그것보다 적으면 유지
const roundOrKeep = (value: number, decimals: number) => {
    const currentDecimals = value.toString().split(".")[1]?.length ?? 0;
    if (currentDecimals <= decimals) return value;
    return Number(value.toFixed(decimals));
};

export function encodeTelemetry(t: Telemetry): TelemetryCompact {
    return {
        t: t.timeStamp,
        x: roundOrKeep(t.lng, 6),
        y: roundOrKeep(t.lat, 6),
        d: roundOrKeep(t.dist, 3),
        p: roundOrKeep(t.pace, 1),
        e: roundOrKeep(t.alt, 1),
        c: roundOrKeep(t.cadence, 0),
        b: roundOrKeep(t.bpm, 0),
        r: t.isRunning,
    };
}

export function decodeTelemetry(t: TelemetryCompact): Telemetry {
    return {
        timeStamp: t.t,
        lat: t.y,
        lng: t.x,
        dist: t.d,
        pace: t.p,
        alt: t.e,
        cadence: t.c,
        bpm: t.b,
        isRunning: t.r,
    };
}

export const encodeTelemetries = (arr: Telemetry[]) => arr.map(encodeTelemetry);
export const decodeTelemetries = (arr: TelemetryCompact[]) =>
    arr.map(decodeTelemetry);
