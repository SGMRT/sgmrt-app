import { Coordinate, getDistance } from "@/src/utils/mapUtils";

/** 날씨 캐시 유효 시간 (1시간) */
export const WEATHER_CACHE_MS = 60 * 60 * 1000;
/** 주소 갱신 트리거 이동 거리 (3km) */
export const ADDRESS_DISTANCE_M = 3000;
/** 지오코딩 실패 후 재시도 억제 시간 (10분) */
export const GEOCODE_BACKOFF_MS = 10 * 60 * 1000;

/** 날씨 갱신이 필요한지 (마지막 갱신 후 1시간 경과) */
export function needWeatherUpdate(
    now: number,
    weatherLastUpdated: number | null
): boolean {
    return now - (weatherLastUpdated ?? 0) >= WEATHER_CACHE_MS;
}

/**
 * 주소(역지오코딩) 갱신이 필요한지 판정.
 *
 * 지오코딩 실패 직후에는 backoff가 끝날 때까지 재시도하지 않는다.
 * 실패 시 저장 좌표가 갱신되지 않아 거리 조건이 계속 참이 되므로,
 * backoff가 없으면 매 위치 업데이트마다 rate-limit된 지오코딩을
 * 반복 호출하게 된다 (REACT-NATIVE-8: 27명에 8,005건).
 */
export function needAddressUpdate(params: {
    now: number;
    current: Coordinate;
    stored: Coordinate | null;
    backoffUntil: number;
}): boolean {
    const { now, current, stored, backoffUntil } = params;
    if (now < backoffUntil) return false;
    const distance = stored ? getDistance(stored, current) : Infinity;
    return distance >= ADDRESS_DISTANCE_M;
}
