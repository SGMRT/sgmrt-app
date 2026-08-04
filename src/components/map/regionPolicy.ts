import { LocationGeocodedAddress } from "expo-location";
import { Coordinate, getDistance } from "../../utils/mapUtils";

/**
 * regionId 첨부 판정 최대 거리 — 지도 중심이 사용자 GPS에서 이보다 멀면
 * "다른 지역을 탐색 중"이므로 내 동네 캐시키를 붙이면 안 된다 (엉뚱한 동네 결과 방지).
 */
export const REGION_ATTACH_MAX_DISTANCE_M = 500;

/**
 * regionId 첨부 시 함께 보내는 반경. 서버의 지역 캐시는 값이 대표좌표 기준 고정 2km이고
 * radiusM > 3000 요청은 캐시 경로를 타지 않으므로(광역 줌 방어), 홈 기본 조회의
 * 뷰포트 유래 반경 대신 이 값으로 고정해 보낸다.
 */
export const REGION_DEFAULT_RADIUS_M = 2000;

/**
 * OS 리버스 지오코딩 결과를 서버 지역 키(시 구 동 전체 경로)로 결합한다.
 * 동명 지역("중앙동" 전국 수십 개) 충돌을 막기 위해 상위 행정구역까지 포함한다.
 *
 * district(동)가 없으면 null — resolve를 건너뛴다 (regionId 없이 조회 = 서버 폴백).
 * 구(city) 단위는 지름 5~8km라, 대표좌표 기준 2km 캐시 값이 구석 사용자에게
 * 화면 밖 코스만 담긴 결과(빈 지도)가 되는 구조적 문제가 있어 키로 쓰지 않는다.
 */
export function composeRegionName(
    addr: Pick<LocationGeocodedAddress, "region" | "city" | "district">,
): string | null {
    if (!addr.district || addr.district.trim().length === 0) return null;
    const parts = [addr.region, addr.city, addr.district].filter(
        (part): part is string => !!part && part.trim().length > 0,
    );
    return parts.join(" ");
}

/**
 * 코스 조회에 regionId를 첨부할지 판정한다.
 * ① 발급받은 regionId가 있고 ② 지도 중심이 사용자 GPS 근처(500m 이내)일 때만 —
 * 지도를 팬해서 다른 동네를 보고 있을 때는 붙이지 않는다 (서버가 요청 좌표로 폴백 조회).
 */
export function shouldAttachRegionId(params: {
    regionId: number | null;
    mapCenter: Coordinate | null;
    userGps: Coordinate | null;
}): boolean {
    const { regionId, mapCenter, userGps } = params;
    if (regionId == null || mapCenter == null || userGps == null) return false;
    return getDistance(mapCenter, userGps) <= REGION_ATTACH_MAX_DISTANCE_M;
}
