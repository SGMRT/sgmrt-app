import {
  ADDRESS_DISTANCE_M,
  GEOCODE_BACKOFF_MS,
  WEATHER_CACHE_MS,
  needAddressUpdate,
  needWeatherUpdate,
} from "@/src/components/map/weatherInfoPolicy"

const T0 = 1_700_000_000_000
const seoul = { lat: 37.5, lng: 127.0 }
// 약 3.5km 북쪽 (>3km)
const far = { lat: 37.5 + 3500 / 111320, lng: 127.0 }
// 약 1km 북쪽 (<3km)
const near = { lat: 37.5 + 1000 / 111320, lng: 127.0 }

describe("needWeatherUpdate", () => {
  it("최초(null)에는 갱신이 필요하다", () => {
    expect(needWeatherUpdate(T0, null)).toBe(true)
  })

  it("1시간이 지나지 않았으면 갱신하지 않는다", () => {
    expect(needWeatherUpdate(T0 + WEATHER_CACHE_MS - 1, T0)).toBe(false)
  })

  it("1시간이 지났으면 갱신한다", () => {
    expect(needWeatherUpdate(T0 + WEATHER_CACHE_MS, T0)).toBe(true)
  })
})

describe("needAddressUpdate", () => {
  it("저장된 좌표가 없으면(최초) 갱신한다", () => {
    expect(
      needAddressUpdate({
        now: T0,
        current: seoul,
        stored: null,
        backoffUntil: 0,
      })
    ).toBe(true)
  })

  it("3km 미만 이동이면 갱신하지 않는다", () => {
    expect(
      needAddressUpdate({
        now: T0,
        current: near,
        stored: seoul,
        backoffUntil: 0,
      })
    ).toBe(false)
  })

  it("3km 이상 이동이면 갱신한다", () => {
    expect(
      needAddressUpdate({
        now: T0,
        current: far,
        stored: seoul,
        backoffUntil: 0,
      })
    ).toBe(true)
  })

  it("backoff 중이면 3km 이상 이동해도 갱신하지 않는다 (재호출 증폭 차단)", () => {
    expect(
      needAddressUpdate({
        now: T0,
        current: far,
        stored: seoul,
        backoffUntil: T0 + GEOCODE_BACKOFF_MS,
      })
    ).toBe(false)
  })

  it("backoff가 끝나면 다시 갱신한다", () => {
    expect(
      needAddressUpdate({
        now: T0 + GEOCODE_BACKOFF_MS,
        current: far,
        stored: seoul,
        backoffUntil: T0 + GEOCODE_BACKOFF_MS,
      })
    ).toBe(true)
  })

  it("상수값이 명세와 일치한다", () => {
    expect(ADDRESS_DISTANCE_M).toBe(3000)
    expect(WEATHER_CACHE_MS).toBe(60 * 60 * 1000)
    expect(GEOCODE_BACKOFF_MS).toBe(10 * 60 * 1000)
  })
})
