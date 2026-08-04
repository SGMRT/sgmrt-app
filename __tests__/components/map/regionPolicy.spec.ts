import {
  REGION_ATTACH_MAX_DISTANCE_M,
  composeRegionName,
  shouldAttachRegionId,
} from "@/src/components/map/regionPolicy"

const userGps = { lat: 37.5, lng: 127.0 }
// 약 300m 북쪽 (<500m)
const nearCenter = { lat: 37.5 + 300 / 111320, lng: 127.0 }
// 약 1km 북쪽 (>500m) — 팬해서 다른 동네를 보는 상황
const pannedCenter = { lat: 37.5 + 1000 / 111320, lng: 127.0 }

describe("composeRegionName", () => {
  it("시 구 동을 공백으로 결합한 전체 경로를 만든다 (동명 지역 충돌 방지)", () => {
    expect(
      composeRegionName({
        region: "서울특별시",
        city: "강남구",
        district: "역삼동",
      })
    ).toBe("서울특별시 강남구 역삼동")
  })

  it("없는 단계는 건너뛰고 있는 것만 결합한다", () => {
    expect(
      composeRegionName({ region: "서울특별시", city: "강남구", district: null })
    ).toBe("서울특별시 강남구")
  })

  it("셋 다 없으면 null — resolve를 건너뛴다", () => {
    expect(
      composeRegionName({ region: null, city: null, district: null })
    ).toBeNull()
  })
})

describe("shouldAttachRegionId", () => {
  it("regionId가 있고 지도 중심이 사용자 GPS 근처면 첨부한다", () => {
    expect(
      shouldAttachRegionId({
        regionId: 42,
        mapCenter: nearCenter,
        userGps,
      })
    ).toBe(true)
  })

  it(`지도 중심이 ${REGION_ATTACH_MAX_DISTANCE_M}m 넘게 떨어져 있으면(팬 상태) 첨부하지 않는다 — 내 동네 캐시가 엉뚱한 지역에 붙는 것 방지`, () => {
    expect(
      shouldAttachRegionId({
        regionId: 42,
        mapCenter: pannedCenter,
        userGps,
      })
    ).toBe(false)
  })

  it("regionId·지도 중심·GPS 중 하나라도 없으면 첨부하지 않는다 (서버 폴백)", () => {
    expect(
      shouldAttachRegionId({ regionId: null, mapCenter: nearCenter, userGps })
    ).toBe(false)
    expect(
      shouldAttachRegionId({ regionId: 42, mapCenter: null, userGps })
    ).toBe(false)
    expect(
      shouldAttachRegionId({ regionId: 42, mapCenter: nearCenter, userGps: null })
    ).toBe(false)
  })
})
