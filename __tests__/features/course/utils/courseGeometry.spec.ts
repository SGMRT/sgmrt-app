import {
  nearestIndexOnPolyline,
  remainingAlongLegM,
  progressAlongCourseM,
  nearestDistanceToPolylineM,
  nearestPointOnPolylineMeters,
  remainingAlongLegM_projected,
  progressAlongCourseM_projected,
} from "@/src/features/course/utils/courseGeometry"
import { Telemetry } from "@/src/apis/types/run"
import { CourseLeg } from "@/src/features/course/types/courseLeg"
import { Checkpoint } from "@/src/apis/types/course"

// 테스트 헬퍼: 텔레메트리 생성
const createTelemetry = (lat: number, lng: number): Telemetry => ({
  lat,
  lng,
  alt: 0,
  timeStamp: Date.now(),
  dist: 0,
  pace: 0,
  cadence: 0,
  bpm: 0,
  isRunning: true,
})

// 테스트 헬퍼: 체크포인트 생성
const createCheckpoint = (lat: number, lng: number): Checkpoint => ({
  lat,
  lng,
  angle: 0,
})

// 테스트 헬퍼: 코스 레그 생성
const createLeg = (
  index: number,
  points: Telemetry[],
  legDistance: number,
  cumDistance: number
): CourseLeg => ({
  index,
  start: createCheckpoint(points[0].lat, points[0].lng),
  end: createCheckpoint(points[points.length - 1].lat, points[points.length - 1].lng),
  legDistance,
  cumDistance,
  points,
})

describe("nearestIndexOnPolyline", () => {
  it("폴리라인에서 가장 가까운 포인트의 인덱스를 반환한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.5005, 127.0) // 첫 번째와 두 번째 사이

    const result = nearestIndexOnPolyline(polyline, point)

    // 37.501에 더 가까움
    expect(result.nearestIndex).toBe(1)
    expect(result.nearestPoint).toEqual(polyline[1])
  })

  it("정확히 일치하는 포인트를 찾는다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.501, 127.0)

    const result = nearestIndexOnPolyline(polyline, point)

    expect(result.nearestIndex).toBe(1)
    expect(result.nearestDistance).toBe(0)
  })

  it("첫 번째 포인트가 가장 가까운 경우", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.4999, 127.0)

    const result = nearestIndexOnPolyline(polyline, point)

    expect(result.nearestIndex).toBe(0)
  })

  it("마지막 포인트가 가장 가까운 경우", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.503, 127.0)

    const result = nearestIndexOnPolyline(polyline, point)

    expect(result.nearestIndex).toBe(2)
  })

  it("거리를 미터 단위로 반환한다", () => {
    const polyline = [createTelemetry(37.5, 127.0)]
    const point = createTelemetry(37.501, 127.0) // 약 111m 북쪽

    const result = nearestIndexOnPolyline(polyline, point)

    expect(result.nearestDistance).toBeGreaterThan(100)
    expect(result.nearestDistance).toBeLessThan(120)
  })
})

describe("nearestPointOnPolylineMeters", () => {
  describe("빈 폴리라인 처리", () => {
    it("빈 폴리라인에서 Infinity 거리를 반환한다", () => {
      const result = nearestPointOnPolylineMeters([], createTelemetry(37.5, 127.0))

      expect(result.distanceM).toBe(Infinity)
      expect(result.segmentIndex).toBe(-1)
    })

    it("단일 포인트 폴리라인을 처리한다", () => {
      const polyline = [createTelemetry(37.5, 127.0)]
      const point = createTelemetry(37.501, 127.0)

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.segmentIndex).toBe(0)
      expect(result.t).toBe(0)
      expect(result.distanceM).toBeGreaterThan(100)
    })
  })

  describe("세그먼트 투영", () => {
    it("세그먼트 중간에 투영된 점을 찾는다", () => {
      // 동서로 뻗은 선분
      const polyline = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.5, 127.002),
      ]
      // 선분 옆에 있는 점 (북쪽으로 조금 벗어남)
      const point = createTelemetry(37.501, 127.001)

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.segmentIndex).toBe(0)
      expect(result.t).toBeGreaterThan(0.4)
      expect(result.t).toBeLessThan(0.6)
      expect(result.closestPoint.lng).toBeCloseTo(127.001, 3)
    })

    it("세그먼트 시작점에 가까운 점을 처리한다", () => {
      const polyline = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.5, 127.002),
      ]
      const point = createTelemetry(37.501, 127.0001) // 시작점 근처

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.t).toBeLessThan(0.1)
    })

    it("세그먼트 끝점에 가까운 점을 처리한다", () => {
      const polyline = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.5, 127.002),
      ]
      const point = createTelemetry(37.501, 127.0019) // 끝점 근처

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.t).toBeGreaterThan(0.9)
    })
  })

  describe("여러 세그먼트 처리", () => {
    it("여러 세그먼트 중 가장 가까운 것을 찾는다", () => {
      const polyline = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.5, 127.001),
        createTelemetry(37.5, 127.002),
        createTelemetry(37.5, 127.003),
      ]
      const point = createTelemetry(37.501, 127.0025) // 세 번째 세그먼트 근처

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.segmentIndex).toBe(2)
    })

    it("꺾인 경로에서 올바른 세그먼트를 찾는다", () => {
      // ㄴ자 형태 경로
      const polyline = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.5, 127.001), // 동쪽으로
        createTelemetry(37.501, 127.001), // 북쪽으로
      ]
      const point = createTelemetry(37.5005, 127.001) // 두 번째 세그먼트 중간

      const result = nearestPointOnPolylineMeters(polyline, point)

      expect(result.segmentIndex).toBe(1)
    })
  })
})

describe("nearestDistanceToPolylineM", () => {
  it("nearestPointOnPolylineMeters의 거리를 반환한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.5, 127.001),
    ]
    const point = createTelemetry(37.501, 127.0005)

    const distance = nearestDistanceToPolylineM(polyline, point)

    expect(distance).toBeGreaterThan(100)
    expect(distance).toBeLessThan(120)
  })
})

describe("remainingAlongLegM", () => {
  it("폴리라인의 남은 거리를 계산한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0), // ~111m
      createTelemetry(37.502, 127.0), // ~111m 더
    ]
    const point = createTelemetry(37.5, 127.0) // 시작점

    const remaining = remainingAlongLegM(polyline, point)

    // 전체 거리 (~222m)
    expect(remaining).toBeGreaterThan(200)
    expect(remaining).toBeLessThan(250)
  })

  it("중간 지점에서 남은 거리를 계산한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.501, 127.0) // 중간점

    const remaining = remainingAlongLegM(polyline, point)

    // 중간점부터 끝까지 (~111m)
    expect(remaining).toBeGreaterThan(100)
    expect(remaining).toBeLessThan(130)
  })

  it("끝점에서 남은 거리는 0에 가깝다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const point = createTelemetry(37.502, 127.0) // 끝점

    const remaining = remainingAlongLegM(polyline, point)

    expect(remaining).toBeLessThan(1)
  })

  it("빈 폴리라인에서 Infinity를 반환한다", () => {
    const remaining = remainingAlongLegM([], createTelemetry(37.5, 127.0))

    expect(remaining).toBe(Infinity)
  })
})

describe("remainingAlongLegM_projected", () => {
  it("투영 기반으로 남은 거리를 계산한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    // 선분 옆에 있는 점
    const point = createTelemetry(37.501, 127.001)

    const remaining = remainingAlongLegM_projected(polyline, point)

    // 중간점에서 끝까지 약 111m
    expect(remaining).toBeGreaterThan(100)
    expect(remaining).toBeLessThan(130)
  })

  it("빈 폴리라인에서 Infinity를 반환한다", () => {
    const remaining = remainingAlongLegM_projected([], createTelemetry(37.5, 127.0))

    expect(remaining).toBe(Infinity)
  })

  it("단일 포인트 폴리라인을 처리한다", () => {
    const polyline = [createTelemetry(37.5, 127.0)]
    const point = createTelemetry(37.501, 127.0)

    const remaining = remainingAlongLegM_projected(polyline, point)

    expect(remaining).toBeGreaterThan(100)
  })
})

describe("progressAlongCourseM", () => {
  it("코스 진행 거리를 계산한다", () => {
    const points1 = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
    ]
    const points2 = [
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const legs: CourseLeg[] = [
      createLeg(0, points1, 111, 111),
      createLeg(1, points2, 111, 222),
    ]

    // 첫 번째 레그 시작점
    const progress = progressAlongCourseM(legs, 0, createTelemetry(37.5, 127.0))

    expect(progress).toBeGreaterThanOrEqual(0)
  })

  it("두 번째 레그에서 진행 거리를 계산한다", () => {
    const points1 = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.0),
    ]
    const points2 = [
      createTelemetry(37.501, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const legs: CourseLeg[] = [
      createLeg(0, points1, 111, 111),
      createLeg(1, points2, 111, 222),
    ]

    // 두 번째 레그 시작점
    const progress = progressAlongCourseM(legs, 1, createTelemetry(37.501, 127.0))

    // 첫 번째 레그 거리(~111m) 근처
    expect(progress).toBeGreaterThan(100)
    expect(progress).toBeLessThan(130)
  })

  it("잘못된 레그 인덱스에서 0을 반환한다", () => {
    const legs: CourseLeg[] = []

    const progress = progressAlongCourseM(legs, 0, createTelemetry(37.5, 127.0))

    expect(progress).toBe(0)
  })
})

describe("progressAlongCourseM_projected", () => {
  it("투영 기반으로 코스 진행 거리를 계산한다", () => {
    const points = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.502, 127.0),
    ]
    const legs: CourseLeg[] = [createLeg(0, points, 222, 222)]

    // 중간 지점
    const progress = progressAlongCourseM_projected(legs, 0, createTelemetry(37.501, 127.0))

    // 절반 정도 진행 (~111m)
    expect(progress).toBeGreaterThan(100)
    expect(progress).toBeLessThan(130)
  })

  it("잘못된 레그 인덱스에서 0을 반환한다", () => {
    const progress = progressAlongCourseM_projected([], 0, createTelemetry(37.5, 127.0))

    expect(progress).toBe(0)
  })
})

describe("정밀도 테스트", () => {
  it("작은 거리 차이를 정확하게 계산한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.5001, 127.0), // 약 11m
    ]
    const point = createTelemetry(37.50005, 127.0) // 중간점

    const result = nearestPointOnPolylineMeters(polyline, point)

    expect(result.distanceM).toBeLessThan(1)
    expect(result.t).toBeCloseTo(0.5, 1)
  })

  it("위도/경도 차이에 따른 거리를 올바르게 계산한다", () => {
    const polyline = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.5, 127.001), // 동쪽으로
    ]
    const point = createTelemetry(37.5001, 127.0005) // 북동쪽

    const result = nearestPointOnPolylineMeters(polyline, point)

    // 약 11m 북쪽
    expect(result.distanceM).toBeGreaterThan(10)
    expect(result.distanceM).toBeLessThan(15)
  })
})
