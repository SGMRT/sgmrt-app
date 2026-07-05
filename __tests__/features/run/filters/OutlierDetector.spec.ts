import { OutlierDetector } from "@/src/features/run/filters/OutlierDetector"
import type { GpsPoint } from "@/src/features/run/filters/types"

// 위도 1도 ≈ 111,320m
const LAT_PER_M = 1 / 111320

/** 기준점(37.5, 127.0)에서 북쪽으로 northM 미터 이동한 GPS 포인트 생성 */
const createPoint = (
  tSec: number,
  northM: number,
  overrides: Partial<GpsPoint> = {}
): GpsPoint => ({
  latitude: 37.5 + northM * LAT_PER_M,
  longitude: 127.0,
  accuracy: 5,
  timestamp: tSec * 1000,
  speed: 3,
  course: 0,
  ...overrides,
})

describe("OutlierDetector", () => {
  let detector: OutlierDetector

  beforeEach(() => {
    detector = new OutlierDetector()
  })

  describe("기본 필터", () => {
    it("첫 포인트는 항상 수용한다", () => {
      const result = detector.detect(createPoint(0, 0))
      expect(result.isOutlier).toBe(false)
    })

    it("정확도가 임계값을 초과하면 거부한다", () => {
      const result = detector.detect(createPoint(0, 0, { accuracy: 25 }))
      expect(result.isOutlier).toBe(true)
      expect(result.reason).toBe("accuracy")
    })

    it("정상 러닝 시퀀스(3m/s)는 모두 수용한다", () => {
      const results = [
        detector.detect(createPoint(0, 0)),
        detector.detect(createPoint(3, 9)),
        detector.detect(createPoint(6, 18)),
        detector.detect(createPoint(9, 27)),
      ]
      expect(results.every((r) => !r.isOutlier)).toBe(true)
    })

    it("순간 점프(2초에 100m)는 거부한다", () => {
      detector.detect(createPoint(0, 0))
      const result = detector.detect(createPoint(2, 100))
      expect(result.isOutlier).toBe(true)
    })
  })

  describe("신호 유실 후 복구 (터널/다리)", () => {
    it("30초 갭 후 물리적으로 타당한 거리(90m)의 포인트는 수용한다", () => {
      detector.detect(createPoint(0, 0))
      detector.detect(createPoint(3, 9))

      // 30초 신호 유실 후 90m 이동 (3m/s로 타당한 이동)
      const result = detector.detect(createPoint(33, 99))

      expect(result.isOutlier).toBe(false)
    })

    it("갭 이후 수용된 포인트를 기준으로 이후 포인트도 정상 수용한다", () => {
      detector.detect(createPoint(0, 0))
      detector.detect(createPoint(3, 9))
      detector.detect(createPoint(33, 99))

      const result = detector.detect(createPoint(36, 108))

      expect(result.isOutlier).toBe(false)
    })
  })

  describe("재앵커 (연속 거부 탈출)", () => {
    it("연속 3회 거부되면 현재 포인트를 새 앵커로 수용한다", () => {
      detector.detect(createPoint(0, 0))

      // 앵커에서 500m 떨어진 위치가 계속 보고됨 (GPS 재배치 등)
      const r1 = detector.detect(createPoint(2, 500))
      const r2 = detector.detect(createPoint(4, 500))
      const r3 = detector.detect(createPoint(6, 500))

      expect(r1.isOutlier).toBe(true)
      expect(r2.isOutlier).toBe(true)
      expect(r3.isOutlier).toBe(false)
      expect(r3.reanchored).toBe(true)
    })

    it("재앵커 이후 포인트는 새 앵커 기준으로 정상 판정한다", () => {
      detector.detect(createPoint(0, 0))
      detector.detect(createPoint(2, 500))
      detector.detect(createPoint(4, 500))
      detector.detect(createPoint(6, 500))

      const result = detector.detect(createPoint(8, 503))

      expect(result.isOutlier).toBe(false)
      expect(result.reanchored).toBeFalsy()
    })

    it("중간에 수용되면 연속 거부 카운터가 리셋된다", () => {
      detector.detect(createPoint(0, 0))
      detector.detect(createPoint(2, 100)) // 거부 1회
      detector.detect(createPoint(4, 6)) // 수용 → 카운터 리셋

      const r1 = detector.detect(createPoint(6, 200)) // 거부 1회
      const r2 = detector.detect(createPoint(8, 200)) // 거부 2회 (재앵커 안됨)

      expect(r1.isOutlier).toBe(true)
      expect(r2.isOutlier).toBe(true)
      expect(r2.reanchored).toBeFalsy()
    })

    it("정확도 거부는 재앵커 카운터에 포함하지 않는다", () => {
      detector.detect(createPoint(0, 0))

      // 저품질 픽스 3연속 — 나쁜 픽스가 앵커가 되면 안됨
      const r1 = detector.detect(createPoint(2, 500, { accuracy: 30 }))
      const r2 = detector.detect(createPoint(4, 500, { accuracy: 30 }))
      const r3 = detector.detect(createPoint(6, 500, { accuracy: 30 }))

      expect(r1.isOutlier).toBe(true)
      expect(r2.isOutlier).toBe(true)
      expect(r3.isOutlier).toBe(true)
      expect(r3.reanchored).toBeFalsy()
    })
  })

  describe("reset", () => {
    it("reset 후 첫 포인트는 다시 무조건 수용한다", () => {
      detector.detect(createPoint(0, 0))
      detector.reset()

      const result = detector.detect(createPoint(2, 500))

      expect(result.isOutlier).toBe(false)
    })
  })
})
