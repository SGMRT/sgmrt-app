import { RawData } from "@/src/types/run";
import { RawRunData } from "../types";

type ExtractOptions = {
    /** 결측(-1) 값이 하나라도 있으면 그 레코드를 제거 */
    strict?: boolean;
    /** 기본 결측 채움 값 (기본 -1) */
    fill?: number;
};

/**
 * RawRunData[] -> RawData[] 변환
 * - 기본적으로 raw.*를 우선 사용
 * - 없거나 null/NaN이면 상위 필드로 폴백, 그래도 없으면 fill(-1)
 */
export function extractRawData(
    list: RawRunData[],
    opts: ExtractOptions = {}
): RawData[] {
    const fill = opts.fill ?? -1;

    const toNum = (
        v: number | null | undefined,
        fallback?: number | null
    ): number => {
        const x = v ?? fallback;
        return typeof x === "number" && Number.isFinite(x) ? x : fill;
    };

    const out: RawData[] = [];

    for (const s of list) {
        const item: RawData = {
            timestamp: toNum(s.raw?.timestamp, s.timestamp),
            latitude: toNum(s.raw?.latitude, s.latitude),
            longitude: toNum(s.raw?.longitude, s.longitude),
            altitude: toNum(s.raw?.altitude, s.altitude),
            speed: toNum(s.raw?.speed, undefined),
            accuracy: toNum(s.raw?.accuracy, undefined),
            altitudeAccuracy: toNum(s.raw?.altitudeAccuracy, undefined),
            pressure: toNum(s.raw?.pressure, s.pressure),
        };

        if (opts.strict) {
            // 필수 필드가 하나라도 결측이면 스킵
            const values = Object.values(item);
            if (values.some((v) => v === fill || Number.isNaN(v))) continue;
        }

        out.push(item);
    }

    return out;
}
