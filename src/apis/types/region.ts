export interface RegionResolveRequest {
    /** 시 구 동 전체 경로 (예: "서울특별시 강남구 역삼동") — 서버 유니크 키 */
    name: string;
    lat: number;
    lng: number;
}

export interface RegionResolveResponse {
    regionId: number;
    name: string;
}
