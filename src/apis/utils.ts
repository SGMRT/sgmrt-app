import { getDataFromS3, parseJsonl } from "./common";
import { CourseResponse } from "./types/course";
import { Telemetry } from "./types/run";

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
                course.telemetries = normalizeTelemetries(parsed);
            } catch (err) {
                console.error("Failed to load telemetries for", course.id, err);
                course.telemetries = [];
            }
        })
    );

    return filteredResponseData;
}

function normalizeTelemetries(parsed: any): Telemetry[] {
    if (!Array.isArray(parsed)) return [];

    // [[...]] 또는 [[[...]]] 같은 케이스를 1레벨씩 풀어서
    // 첫 원소가 배열이 아닐 때까지 평탄화
    let arr: any[] = parsed;
    while (Array.isArray(arr[0])) {
        arr = arr.flat(1);
    }

    // lat/lng 유효한 것만 필터
    return arr.filter(
        (p) => p && typeof p.lat === "number" && typeof p.lng === "number"
    );
}
