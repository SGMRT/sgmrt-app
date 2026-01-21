import { extractRawData } from "@/src/features/run/utils/extractRawData"
import { RawRunData } from "@/src/features/run/types"

// 테스트용 RawRunData 생성
const createRawRunData = (
  overrides: Partial<RawRunData> = {}
): RawRunData => ({
  timestamp: 1000,
  latitude: 37.5,
  longitude: 127.0,
  altitude: 50,
  pressure: 1013,
  steps: null,
  distance: 0,
  isRunning: true,
  bpm: null,
  raw: {
    timestamp: 1000,
    latitude: 37.5,
    longitude: 127.0,
    accuracy: 10,
    altitude: 50,
    altitudeAccuracy: 5,
    speed: 3,
    course: 90,
    pressure: 1013,
  },
  ...overrides,
})

describe("extractRawData", () => {
  it("빈 배열은 빈 배열 반환", () => {
    expect(extractRawData([])).toEqual([])
  })

  it("raw 필드 우선 사용", () => {
    const input = [
      createRawRunData({
        timestamp: 500, // 상위 필드
        raw: {
          timestamp: 1000, // raw 필드 (우선)
          latitude: 37.5,
          longitude: 127.0,
          accuracy: 10,
          altitude: 50,
          altitudeAccuracy: 5,
          speed: 3,
          course: 90,
          pressure: 1013,
        },
      }),
    ]

    const result = extractRawData(input)

    expect(result[0].timestamp).toBe(1000) // raw.timestamp 사용
  })

  it("raw 필드가 없으면 상위 필드로 폴백", () => {
    const input = [
      createRawRunData({
        timestamp: 1000,
        latitude: 37.5,
        longitude: 127.0,
        altitude: 50,
        pressure: 1013,
        raw: {
          timestamp: undefined as any,
          latitude: undefined as any,
          longitude: undefined as any,
          accuracy: 10,
          altitude: undefined as any,
          altitudeAccuracy: 5,
          speed: 3,
          course: 90,
          pressure: undefined as any,
        },
      }),
    ]

    const result = extractRawData(input)

    expect(result[0].timestamp).toBe(1000)
    expect(result[0].latitude).toBe(37.5)
    expect(result[0].longitude).toBe(127.0)
    expect(result[0].altitude).toBe(50)
    expect(result[0].pressure).toBe(1013)
  })

  it("폴백도 없으면 기본값 -1", () => {
    const input = [
      createRawRunData({
        raw: {
          timestamp: 1000,
          latitude: 37.5,
          longitude: 127.0,
          accuracy: undefined as any,
          altitude: 50,
          altitudeAccuracy: undefined as any,
          speed: undefined as any,
          course: 90,
          pressure: 1013,
        },
      }),
    ]

    const result = extractRawData(input)

    expect(result[0].accuracy).toBe(-1)
    expect(result[0].altitudeAccuracy).toBe(-1)
    expect(result[0].speed).toBe(-1)
  })

  it("커스텀 fill 값 사용", () => {
    const input = [
      createRawRunData({
        raw: {
          timestamp: 1000,
          latitude: 37.5,
          longitude: 127.0,
          accuracy: null as any,
          altitude: 50,
          altitudeAccuracy: 5,
          speed: 3,
          course: 90,
          pressure: 1013,
        },
      }),
    ]

    const result = extractRawData(input, { fill: 0 })

    expect(result[0].accuracy).toBe(0)
  })

  it("strict 모드: 결측값이 있으면 레코드 제외", () => {
    const input = [
      createRawRunData(), // 완전한 데이터
      createRawRunData({
        raw: {
          timestamp: 1000,
          latitude: 37.5,
          longitude: 127.0,
          accuracy: null as any, // 결측
          altitude: 50,
          altitudeAccuracy: 5,
          speed: 3,
          course: 90,
          pressure: 1013,
        },
      }),
    ]

    const result = extractRawData(input, { strict: true })

    expect(result).toHaveLength(1)
  })

  it("strict 모드: NaN도 결측으로 처리", () => {
    const input = [
      createRawRunData({
        raw: {
          timestamp: NaN,
          latitude: 37.5,
          longitude: 127.0,
          accuracy: 10,
          altitude: 50,
          altitudeAccuracy: 5,
          speed: 3,
          course: 90,
          pressure: 1013,
        },
      }),
    ]

    const result = extractRawData(input, { strict: true })

    expect(result).toHaveLength(0)
  })

  it("여러 레코드 처리", () => {
    const input = [
      createRawRunData({ timestamp: 1000 }),
      createRawRunData({ timestamp: 2000 }),
      createRawRunData({ timestamp: 3000 }),
    ]

    const result = extractRawData(input)

    expect(result).toHaveLength(3)
  })

  it("결과 객체에 필요한 필드만 포함", () => {
    const input = [createRawRunData()]
    const result = extractRawData(input)

    expect(Object.keys(result[0]).sort()).toEqual([
      "accuracy",
      "altitude",
      "altitudeAccuracy",
      "course",
      "latitude",
      "longitude",
      "pressure",
      "speed",
      "timestamp",
    ])
  })
})
