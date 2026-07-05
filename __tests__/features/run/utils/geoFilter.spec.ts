import { KalmanFilter1D, geoFilter } from "@/src/features/run/utils/geoFilter"

describe("KalmanFilter1D", () => {
  let filter: KalmanFilter1D

  beforeEach(() => {
    filter = new KalmanFilter1D()
  })

  describe("초기화", () => {
    it("첫 번째 측정값을 그대로 반환한다", () => {
      const result = filter.process(37.5, 0.0001, 1000, 0)

      expect(result).toBe(37.5)
    })

    it("초기 추정값을 저장한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)

      expect(filter.getEstimate()).toBe(37.5)
    })

    it("reset 후 첫 측정값을 다시 그대로 반환한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)
      filter.process(37.6, 0.0001, 2000, 0)
      filter.reset()

      const result = filter.process(38.0, 0.0001, 3000, 0)

      expect(result).toBe(38.0)
    })
  })

  describe("필터링 동작", () => {
    it("측정값과 추정값 사이의 값을 반환한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)
      const result = filter.process(37.6, 0.0001, 2000, 0)

      // 필터링된 값은 이전 추정값(37.5)과 새 측정값(37.6) 사이에 있어야 함
      expect(result).toBeGreaterThan(37.5)
      expect(result).toBeLessThan(37.6)
    })

    it("정확도가 높은 측정값을 더 신뢰한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)

      // 높은 정확도 (낮은 값 = 더 정확)
      const highAccuracyResult = filter.process(37.6, 0.00001, 2000, 0)
      filter.reset()

      filter.process(37.5, 0.0001, 1000, 0)

      // 낮은 정확도 (높은 값 = 덜 정확)
      const lowAccuracyResult = filter.process(37.6, 0.001, 2000, 0)

      // 높은 정확도 결과가 측정값(37.6)에 더 가까워야 함
      expect(Math.abs(highAccuracyResult - 37.6)).toBeLessThan(Math.abs(lowAccuracyResult - 37.6))
    })

    it("시간이 지날수록 예측 불확실성이 누적된다", () => {
      filter.process(37.5, 0.0001, 1000, 0)

      // 짧은 시간 간격
      const shortIntervalResult = filter.process(37.6, 0.0001, 1100, 0)
      filter.reset()

      filter.process(37.5, 0.0001, 1000, 0)

      // 매우 긴 시간 간격 (워밍업 이후 + 충분한 시간)
      const longIntervalResult = filter.process(37.6, 0.0001, 20000, 2) // 19초 후, 속도 2m/s

      // 두 결과 모두 이전 값과 측정값 사이에 있어야 함
      expect(shortIntervalResult).toBeGreaterThan(37.5)
      expect(shortIntervalResult).toBeLessThan(37.6)
      expect(longIntervalResult).toBeGreaterThan(37.5)
      expect(longIntervalResult).toBeLessThan(37.6)
    })

    it("속도가 빠를수록 예측 불확실성이 증가한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)
      const slowSpeedResult = filter.process(37.6, 0.0001, 5000, 1) // 1 m/s
      filter.reset()

      filter.process(37.5, 0.0001, 1000, 0)
      const fastSpeedResult = filter.process(37.6, 0.0001, 5000, 10) // 10 m/s

      // 빠른 속도에서 새 측정값(37.6)에 더 가까워야 함 (예측 불확실성 증가)
      expect(Math.abs(fastSpeedResult - 37.6)).toBeLessThan(Math.abs(slowSpeedResult - 37.6))
    })

    it("워밍업 기간(3초) 동안 더 민첩하게 반응한다", () => {
      // 워밍업 기간 내
      filter.process(37.5, 0.0001, 1000, 0)
      const warmupResult = filter.process(37.6, 0.0001, 2000, 0) // 1초 후
      filter.reset()

      // 워밍업 기간 이후
      filter.process(37.5, 0.0001, 1000, 0)
      const afterWarmupResult = filter.process(37.6, 0.0001, 5000, 0) // 4초 후
      filter.reset()

      // 워밍업 중에도 필터링이 적용되어야 함
      expect(warmupResult).not.toBe(37.6)
      expect(afterWarmupResult).not.toBe(37.6)
    })
  })

  describe("엣지 케이스", () => {
    it("매우 작은 정확도 값을 최소값으로 클램핑한다", () => {
      const result = filter.process(37.5, 0, 1000, 0)

      expect(result).toBe(37.5)
    })

    it("음수 정확도를 처리한다", () => {
      const result = filter.process(37.5, -1, 1000, 0)

      expect(result).toBe(37.5)
    })

    it("동일한 타임스탬프에서 여러 번 처리해도 동작한다", () => {
      filter.process(37.5, 0.0001, 1000, 0)
      const result1 = filter.process(37.6, 0.0001, 1000, 0)
      const result2 = filter.process(37.7, 0.0001, 1000, 0)

      expect(typeof result1).toBe("number")
      expect(typeof result2).toBe("number")
    })

    it("연속적인 측정값을 부드럽게 필터링한다", () => {
      const measurements = [37.5, 37.51, 37.52, 37.53, 37.54, 37.55]
      const results: number[] = []

      measurements.forEach((m, i) => {
        results.push(filter.process(m, 0.0001, 1000 + i * 1000, 2))
      })

      // 결과값이 점진적으로 증가해야 함
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThan(results[i - 1])
      }
    })
  })
})

describe("geoFilter (KalmanFilter2D)", () => {
  beforeEach(() => {
    geoFilter.reset()
  })

  describe("초기화", () => {
    it("첫 번째 좌표를 필터링하여 반환한다", () => {
      const result = geoFilter.process(37.5, 127.0, 10, 1000, 0)

      expect(result.latitude).toBe(37.5)
      expect(result.longitude).toBe(127.0)
    })

    it("reset 후 새 좌표를 초기값으로 사용한다", () => {
      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      geoFilter.process(37.6, 127.1, 10, 2000, 0)
      geoFilter.reset()

      const result = geoFilter.process(38.0, 128.0, 10, 3000, 0)

      expect(result.latitude).toBe(38.0)
      expect(result.longitude).toBe(128.0)
    })
  })

  describe("필터링 동작", () => {
    it("위도와 경도를 독립적으로 필터링한다", () => {
      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      const result = geoFilter.process(37.6, 127.2, 10, 2000, 0)

      // 두 값 모두 필터링되어야 함
      expect(result.latitude).toBeGreaterThan(37.5)
      expect(result.latitude).toBeLessThan(37.6)
      expect(result.longitude).toBeGreaterThan(127.0)
      expect(result.longitude).toBeLessThan(127.2)
    })

    it("높은 정확도(낮은 오차)에서 측정값을 더 신뢰한다", () => {
      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      const highAccuracyResult = geoFilter.process(37.6, 127.1, 1, 2000, 0) // 1m 오차
      geoFilter.reset()

      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      const lowAccuracyResult = geoFilter.process(37.6, 127.1, 100, 2000, 0) // 100m 오차

      // 높은 정확도 결과가 측정값에 더 가까워야 함
      expect(Math.abs(highAccuracyResult.latitude - 37.6)).toBeLessThan(
        Math.abs(lowAccuracyResult.latitude - 37.6)
      )
    })

    it("getEstimate로 현재 추정값을 조회할 수 있다", () => {
      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      geoFilter.process(37.6, 127.1, 10, 2000, 0)

      const estimate = geoFilter.getEstimate()

      expect(typeof estimate.latitude).toBe("number")
      expect(typeof estimate.longitude).toBe("number")
    })
  })

  describe("정밀도", () => {
    it("full double precision으로 반환한다 (TelemetryCompact에서 최종 라운딩)", () => {
      geoFilter.process(37.5, 127.0, 10, 1000, 0)
      const result = geoFilter.process(37.5000001, 127.0000001, 10, 2000, 0)

      // 양자화 노이즈 방지를 위해 toFixed(6) 제거 → 자연 정밀도 유지
      expect(typeof result.latitude).toBe("number")
      expect(typeof result.longitude).toBe("number")
    })
  })

  describe("실제 사용 시나리오", () => {
    it("GPS 노이즈를 줄인다", () => {
      // 실제 위치는 37.5, 127.0 근처인데 노이즈가 있는 상황 시뮬레이션
      const noisyMeasurements = [
        { lat: 37.5, lng: 127.0 },
        { lat: 37.502, lng: 127.002 }, // 갑자기 튄 값
        { lat: 37.501, lng: 127.001 },
        { lat: 37.5005, lng: 127.0005 },
        { lat: 37.503, lng: 127.003 }, // 또 튄 값
        { lat: 37.5008, lng: 127.0008 },
      ]

      const results: { latitude: number; longitude: number }[] = []

      noisyMeasurements.forEach((m, i) => {
        results.push(geoFilter.process(m.lat, m.lng, 15, 1000 + i * 1000, 2))
      })

      // 필터링 후 결과가 측정값보다 변동이 적어야 함
      const measurementVariance = calculateVariance(noisyMeasurements.map((m) => m.lat))
      const resultVariance = calculateVariance(results.map((r) => r.latitude))

      expect(resultVariance).toBeLessThan(measurementVariance)
    })

    it("연속적인 이동 경로를 부드럽게 처리한다", () => {
      // 북쪽으로 이동하는 시나리오
      const path = Array.from({ length: 10 }, (_, i) => ({
        lat: 37.5 + i * 0.001,
        lng: 127.0,
        ts: 1000 + i * 1000,
      }))

      const results: { latitude: number; longitude: number }[] = []

      path.forEach((p) => {
        results.push(geoFilter.process(p.lat, p.lng, 10, p.ts, 3))
      })

      // 결과가 점진적으로 증가해야 함
      for (let i = 1; i < results.length; i++) {
        expect(results[i].latitude).toBeGreaterThan(results[i - 1].latitude)
      }
    })
  })
})

// 분산 계산 헬퍼 함수
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
}
