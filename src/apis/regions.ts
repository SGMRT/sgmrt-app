import { errorLog } from "../utils/devLog";
import server from "./instance";
import { RegionResolveRequest, RegionResolveResponse } from "./types/region";

/**
 * 지역 등록(resolve) — 지도 코스 조회의 서버 캐시키(regionId)를 발급받는다.
 *
 * 멱등: 같은 이름은 항상 같은 regionId를 반환한다 (없으면 서버가 생성).
 * 실패해도 코스 조회는 regionId 없이 동작하므로(서버 폴백) 호출부는 실패를 치명적으로 다루지 않는다.
 */
export async function resolveRegion(
    request: RegionResolveRequest,
): Promise<RegionResolveResponse> {
    try {
        const response = await server.post("/regions", request);
        return response.data as RegionResolveResponse;
    } catch (error) {
        errorLog(error);
        throw error;
    }
}
