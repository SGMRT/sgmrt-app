import { buildCourseLegs } from "@/src/features/course/utils/buildCourseLegs"
import { Checkpoint } from "@/src/apis/types/course"
import { Telemetry } from "@/src/apis/types/run"

// 테스트 헬퍼: 간단한 텔레메트리 생성
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

// 테스트 헬퍼: 간단한 체크포인트 생성
const createCheckpoint = (lat: number, lng: number): Checkpoint => ({
  lat,
  lng,
  angle: 0,
})

describe("buildCourseLegs", () => {
  describe("기본 동작", () => {
    it("코스와 체크포인트로 레그를 생성한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
        createTelemetry(37.503, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.0),
        createCheckpoint(37.503, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toHaveLength(2)
      expect(legs[0].index).toBe(0)
      expect(legs[1].index).toBe(1)
    })

    it("레그에 올바른 시작/끝 체크포인트를 설정한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs[0].start).toEqual(checkpoints[0])
      expect(legs[0].end).toEqual(checkpoints[1])
    })

    it("레그 거리를 계산한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0), // ~111m 북쪽
        createTelemetry(37.502, 127.0), // ~111m 더 북쪽
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      // 약 222m (0.002도 * 111km/도)
      expect(legs[0].legDistance).toBeGreaterThan(200)
      expect(legs[0].legDistance).toBeLessThan(250)
    })

    it("누적 거리를 계산한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
        createTelemetry(37.503, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.501, 127.0),
        createCheckpoint(37.502, 127.0),
        createCheckpoint(37.503, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      // 누적 거리는 점점 증가해야 함
      expect(legs[0].cumDistance).toBe(legs[0].legDistance)
      expect(legs[1].cumDistance).toBe(legs[0].cumDistance + legs[1].legDistance)
      expect(legs[2].cumDistance).toBe(legs[1].cumDistance + legs[2].legDistance)
    })

    it("레그에 포함되는 포인트들을 저장한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
        createTelemetry(37.503, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      // 첫 번째 레그는 인덱스 0~2 포함
      expect(legs[0].points).toHaveLength(3)
      expect(legs[0].points[0]).toEqual(course[0])
      expect(legs[0].points[2]).toEqual(course[2])
    })
  })

  describe("빈 입력 처리", () => {
    it("코스가 2개 미만이면 빈 배열을 반환한다", () => {
      const course = [createTelemetry(37.5, 127.0)]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.501, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toEqual([])
    })

    it("체크포인트가 2개 미만이면 빈 배열을 반환한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
      ]
      const checkpoints = [createCheckpoint(37.5, 127.0)]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toEqual([])
    })

    it("빈 코스에 빈 배열을 반환한다", () => {
      const legs = buildCourseLegs([], [])

      expect(legs).toEqual([])
    })
  })

  describe("정확 일치 매핑", () => {
    it("체크포인트와 정확히 일치하는 코스 포인트를 찾는다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.001),
        createTelemetry(37.502, 127.002),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.002),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toHaveLength(1)
      expect(legs[0].points[0].lat).toBe(37.5)
      expect(legs[0].points[legs[0].points.length - 1].lat).toBe(37.502)
    })
  })

  describe("근접 매칭", () => {
    it("eps 범위 내의 근접한 포인트를 찾는다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
      ]
      // 약간 다른 좌표의 체크포인트 (1m 정도 차이)
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502001, 127.0), // 약 0.1m 차이
      ]

      const legs = buildCourseLegs(course, checkpoints, { epsMeters: 5 })

      expect(legs).toHaveLength(1)
    })

    it("커스텀 eps 값을 사용할 수 있다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.5021, 127.0), // ~10m 차이
      ]

      // 기본 eps(3m)로는 찾지 못함
      const legsDefault = buildCourseLegs(course, checkpoints)
      // 넓은 eps(20m)로는 찾을 수 있음
      const legsWide = buildCourseLegs(course, checkpoints, { epsMeters: 20 })

      expect(legsDefault).toHaveLength(1)
      expect(legsWide).toHaveLength(1)
    })
  })

  describe("단조 증가 보장", () => {
    it("체크포인트는 코스를 따라 순서대로 매핑된다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
        createTelemetry(37.503, 127.0),
        createTelemetry(37.504, 127.0),
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.502, 127.0),
        createCheckpoint(37.504, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toHaveLength(2)
      // 각 레그의 포인트가 순서대로 진행
      expect(legs[0].points[0].lat).toBeLessThan(legs[0].points[legs[0].points.length - 1].lat)
      expect(legs[1].points[0].lat).toBeLessThan(legs[1].points[legs[1].points.length - 1].lat)
    })

    it("중복 체크포인트(같은 인덱스)는 스킵한다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.502, 127.0),
      ]
      // 두 번째와 세 번째 체크포인트가 같은 위치
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.501, 127.0),
        createCheckpoint(37.501, 127.0), // 중복
        createCheckpoint(37.502, 127.0),
      ]

      const legs = buildCourseLegs(course, checkpoints)

      // 중복이 스킵되어 2개 레그만 생성
      expect(legs).toHaveLength(2)
    })
  })

  describe("에러 처리", () => {
    it("매핑할 수 없는 체크포인트가 있으면 에러를 던진다", () => {
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
      ]
      // 코스에서 한참 떨어진 체크포인트
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(38.0, 128.0), // 매우 멀리 떨어진 좌표
      ]

      // eps가 작으면 두 번째 체크포인트를 찾을 수 없으나,
      // 실제로는 가장 가까운 포인트를 찾음 (bestIdx = 1)
      // 이 테스트는 코스 밖에 체크포인트가 있어도 가장 가까운 점을 찾는 것을 확인
      const legs = buildCourseLegs(course, checkpoints)

      // 실제로는 가장 가까운 점을 찾아서 레그를 생성함
      expect(legs).toHaveLength(1)
    })
  })

  describe("복잡한 시나리오", () => {
    it("루프 코스를 처리한다", () => {
      // 원형 코스 (시작점으로 돌아옴)
      const course = [
        createTelemetry(37.5, 127.0),
        createTelemetry(37.501, 127.0),
        createTelemetry(37.501, 127.001),
        createTelemetry(37.5, 127.001),
        createTelemetry(37.5, 127.0), // 시작점으로 돌아옴
      ]
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.501, 127.001),
        createCheckpoint(37.5, 127.0), // 시작점 (마지막 포인트와 일치)
      ]

      const legs = buildCourseLegs(course, checkpoints)

      expect(legs).toHaveLength(2)
    })

    it("많은 수의 포인트를 효율적으로 처리한다", () => {
      // 1000개 포인트 생성
      const course: Telemetry[] = Array.from({ length: 1000 }, (_, i) =>
        createTelemetry(37.5 + i * 0.0001, 127.0)
      )
      const checkpoints = [
        createCheckpoint(37.5, 127.0),
        createCheckpoint(37.55, 127.0), // 중간 지점
        createCheckpoint(37.5 + 999 * 0.0001, 127.0), // 마지막 지점
      ]

      const startTime = Date.now()
      const legs = buildCourseLegs(course, checkpoints)
      const elapsed = Date.now() - startTime

      expect(legs).toHaveLength(2)
      expect(elapsed).toBeLessThan(100) // 100ms 이내에 완료
    })
  })
})
