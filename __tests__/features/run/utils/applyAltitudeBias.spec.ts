import { applyAltitudeBiasFromBestGPS } from "@/src/features/run/utils/applyAltitudeBias"
import { Telemetry } from "@/src/apis/types/run"
import { RawData } from "@/src/types/run"

// 테스트용 텔레메트리 생성
const createTelemetry = (
  timeStamp: number,
  alt: number,
  overrides: Partial<Telemetry> = {}
): Telemetry => ({
  timeStamp,
  lat: 37.5,
  lng: 127.0,
  dist: 0,
  pace: 300,
  alt,
  cadence: 160,
  bpm: 140,
  isRunning: true,
  ...overrides,
})

// 테스트용 RawData 생성
const createRawData = (
  timestamp: number,
  altitude: number,
  altitudeAccuracy: number,
  overrides: Partial<RawData> = {}
): RawData => ({
  timestamp,
  latitude: 37.5,
  longitude: 127.0,
  altitude,
  speed: 3,
  accuracy: 10,
  altitudeAccuracy,
  pressure: 1013,
  course: 90,
  ...overrides,
})

describe("applyAltitudeBiasFromBestGPS", () => {
  describe("엣지 케이스", () => {
    it("빈 telemetries는 그대로 반환한다", () => {
      const rawData = [createRawData(1000, 100, 5)]
      const result = applyAltitudeBiasFromBestGPS([], rawData)
      expect(result).toEqual([])
    })

    it("빈 rawData는 telemetries를 그대로 반환한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const result = applyAltitudeBiasFromBestGPS(telemetries, [])
      expect(result).toEqual(telemetries)
    })

    it("null/undefined telemetries는 그대로 반환한다", () => {
      const rawData = [createRawData(1000, 100, 5)]
      expect(applyAltitudeBiasFromBestGPS(null as any, rawData)).toBeNull()
      expect(
        applyAltitudeBiasFromBestGPS(undefined as any, rawData)
      ).toBeUndefined()
    })

    it("null/undefined rawData는 telemetries를 그대로 반환한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      expect(applyAltitudeBiasFromBestGPS(telemetries, null as any)).toEqual(
        telemetries
      )
      expect(
        applyAltitudeBiasFromBestGPS(telemetries, undefined as any)
      ).toEqual(telemetries)
    })
  })

  describe("유효하지 않은 rawData 필터링", () => {
    it("altitude가 유한하지 않은 rawData는 무시한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [
        createRawData(1000, NaN, 5),
        createRawData(1001, Infinity, 5),
        createRawData(1002, -Infinity, 5),
      ]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).toEqual(telemetries)
    })

    it("timestamp가 유한하지 않은 rawData는 무시한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [createRawData(NaN, 100, 5)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).toEqual(telemetries)
    })

    it("altitudeAccuracy가 유한하지 않은 rawData는 무시한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [createRawData(1000, 100, NaN)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).toEqual(telemetries)
    })

    it("altitudeAccuracy가 음수인 rawData는 무시한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [createRawData(1000, 100, -1)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).toEqual(telemetries)
    })

    it("유효한 rawData가 하나라도 있으면 bias를 적용한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [
        createRawData(1000, NaN, 5), // 무시
        createRawData(1000, 100, 5), // 유효
        createRawData(1000, 200, -1), // 무시
      ]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // bias = 100 - 50 = 50
      expect(result[0].alt).toBe(100)
    })
  })

  describe("가장 정확한 GPS 샘플 선택", () => {
    it("altitudeAccuracy가 가장 작은 rawData를 선택한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [
        createRawData(1000, 80, 10), // accuracy 10
        createRawData(1000, 90, 3), // accuracy 3 (가장 정확)
        createRawData(1000, 100, 7), // accuracy 7
      ]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // best = altitude 90, accuracy 3
      // bias = 90 - 50 = 40
      expect(result[0].alt).toBe(90)
    })

    it("동일한 accuracy면 reduce 특성상 마지막이 선택된다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [
        createRawData(1000, 80, 5),
        createRawData(1000, 90, 5),
      ]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // reduce에서 a < b 조건: 동일할 때는 a < b가 false이므로 b 반환
      // 마지막 rawData(altitude 90) 선택
      // bias = 90 - 50 = 40
      expect(result[0].alt).toBe(90)
    })
  })

  describe("가장 가까운 telemetry 매칭", () => {
    it("timestamp가 정확히 일치하는 telemetry를 찾는다", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(2000, 55),
        createTelemetry(3000, 60),
      ]
      const rawData = [createRawData(2000, 100, 5)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // best timestamp 2000 → telemetries[1] 매칭 (alt 55)
      // bias = 100 - 55 = 45
      expect(result[0].alt).toBe(50 + 45) // 95
      expect(result[1].alt).toBe(55 + 45) // 100
      expect(result[2].alt).toBe(60 + 45) // 105
    })

    it("가장 가까운 timestamp의 telemetry를 찾는다", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(3000, 60),
        createTelemetry(5000, 70),
      ]
      const rawData = [createRawData(2800, 100, 5)] // 3000에 가장 가까움

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // nearest = telemetries[1] (timestamp 3000, alt 60)
      // bias = 100 - 60 = 40
      expect(result[1].alt).toBe(100) // 원래 60 + bias 40
    })

    it("첫 번째 telemetry가 가장 가까울 때", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(5000, 70),
      ]
      const rawData = [createRawData(1200, 100, 5)] // 1000에 가장 가까움

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // bias = 100 - 50 = 50
      expect(result[0].alt).toBe(100)
      expect(result[1].alt).toBe(120)
    })

    it("마지막 telemetry가 가장 가까울 때", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(5000, 70),
      ]
      const rawData = [createRawData(4800, 100, 5)] // 5000에 가장 가까움

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // bias = 100 - 70 = 30
      expect(result[0].alt).toBe(80)
      expect(result[1].alt).toBe(100)
    })
  })

  describe("bias 적용", () => {
    it("양수 bias를 모든 telemetry에 적용한다", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(2000, 55),
        createTelemetry(3000, 60),
      ]
      const rawData = [createRawData(1000, 100, 5)] // bias = 100 - 50 = 50

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result[0].alt).toBe(100)
      expect(result[1].alt).toBe(105)
      expect(result[2].alt).toBe(110)
    })

    it("음수 bias를 모든 telemetry에 적용한다", () => {
      const telemetries = [
        createTelemetry(1000, 100),
        createTelemetry(2000, 110),
        createTelemetry(3000, 120),
      ]
      const rawData = [createRawData(1000, 50, 5)] // bias = 50 - 100 = -50

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result[0].alt).toBe(50)
      expect(result[1].alt).toBe(60)
      expect(result[2].alt).toBe(70)
    })

    it("bias가 0이면 고도가 변하지 않는다", () => {
      const telemetries = [
        createTelemetry(1000, 100),
        createTelemetry(2000, 110),
      ]
      const rawData = [createRawData(1000, 100, 5)] // bias = 100 - 100 = 0

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result[0].alt).toBe(100)
      expect(result[1].alt).toBe(110)
    })

    it("유한하지 않은 alt는 변경하지 않는다", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(2000, NaN),
        createTelemetry(3000, Infinity),
      ]
      const rawData = [createRawData(1000, 100, 5)] // bias = 50

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result[0].alt).toBe(100)
      expect(result[1].alt).toBeNaN()
      expect(result[2].alt).toBe(Infinity)
    })

    it("nearest telemetry의 alt가 유한하지 않으면 원본 반환", () => {
      const telemetries = [createTelemetry(1000, NaN)]
      const rawData = [createRawData(1000, 100, 5)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).toEqual(telemetries)
    })
  })

  describe("불변성 (Immutability)", () => {
    it("원본 telemetries를 변경하지 않는다", () => {
      const telemetries = [
        createTelemetry(1000, 50),
        createTelemetry(2000, 60),
      ]
      const originalAlt0 = telemetries[0].alt
      const originalAlt1 = telemetries[1].alt

      const rawData = [createRawData(1000, 100, 5)]

      applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(telemetries[0].alt).toBe(originalAlt0)
      expect(telemetries[1].alt).toBe(originalAlt1)
    })

    it("새로운 배열과 객체를 반환한다", () => {
      const telemetries = [createTelemetry(1000, 50)]
      const rawData = [createRawData(1000, 100, 5)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result).not.toBe(telemetries)
      expect(result[0]).not.toBe(telemetries[0])
    })
  })

  describe("다른 필드 보존", () => {
    it("alt 외의 필드는 변경되지 않는다", () => {
      const telemetries = [
        createTelemetry(1000, 50, {
          lat: 37.123,
          lng: 127.456,
          dist: 100,
          pace: 350,
          cadence: 180,
          bpm: 150,
          isRunning: false,
        }),
      ]
      const rawData = [createRawData(1000, 100, 5)]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      expect(result[0].timeStamp).toBe(1000)
      expect(result[0].lat).toBe(37.123)
      expect(result[0].lng).toBe(127.456)
      expect(result[0].dist).toBe(100)
      expect(result[0].pace).toBe(350)
      expect(result[0].cadence).toBe(180)
      expect(result[0].bpm).toBe(150)
      expect(result[0].isRunning).toBe(false)
      // alt만 변경됨
      expect(result[0].alt).toBe(100)
    })
  })

  describe("실제 시나리오", () => {
    it("러닝 중 기압계 드리프트 보정", () => {
      // 기압계 기반 고도가 10m 드리프트 된 시나리오
      const telemetries = [
        createTelemetry(0, 40), // 실제 50m인데 40으로 측정
        createTelemetry(1000, 45),
        createTelemetry(2000, 50),
        createTelemetry(3000, 48),
      ]
      // GPS가 2000ms에 정확한 고도 60m 측정 (accuracy 3m)
      const rawData = [
        createRawData(500, 52, 10), // 덜 정확
        createRawData(2000, 60, 3), // 가장 정확
        createRawData(2500, 58, 8), // 덜 정확
      ]

      const result = applyAltitudeBiasFromBestGPS(telemetries, rawData)

      // best: timestamp 2000, altitude 60, accuracy 3
      // nearest: telemetries[2] (timestamp 2000, alt 50)
      // bias = 60 - 50 = 10
      expect(result[0].alt).toBe(50)
      expect(result[1].alt).toBe(55)
      expect(result[2].alt).toBe(60)
      expect(result[3].alt).toBe(58)
    })
  })
})
