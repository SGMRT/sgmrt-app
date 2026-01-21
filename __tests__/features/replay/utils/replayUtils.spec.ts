import {
  alphaFromTau,
  buildVirtualTimeline,
  headingBetween,
  lerp,
  norm180,
  toDeg,
} from "@/src/features/replay/utils"
import { Sample } from "@/src/features/replay/types"

// 테스트 헬퍼: Sample 생성
const createSample = (
  x: number,
  y: number,
  d: number = 0,
  p: number = 300,
  e: number = 50,
  c: number = 160,
  t: number = 0
): Sample => ({
  x,
  y,
  d,
  p,
  e,
  c,
  t,
})

describe("lerp (선형 보간)", () => {
  it("t=0이면 a를 반환한다", () => {
    expect(lerp(0, 100, 0)).toBe(0)
  })

  it("t=1이면 b를 반환한다", () => {
    expect(lerp(0, 100, 1)).toBe(100)
  })

  it("t=0.5이면 중간값을 반환한다", () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
  })

  it("t가 0-1 범위를 벗어나도 외삽한다", () => {
    expect(lerp(0, 100, 2)).toBe(200)
    expect(lerp(0, 100, -1)).toBe(-100)
  })

  it("음수 값도 처리한다", () => {
    expect(lerp(-100, 100, 0.5)).toBe(0)
  })
})

describe("toDeg (라디안 → 도)", () => {
  it("0 라디안은 0도이다", () => {
    expect(toDeg(0)).toBe(0)
  })

  it("π 라디안은 180도이다", () => {
    expect(toDeg(Math.PI)).toBeCloseTo(180)
  })

  it("π/2 라디안은 90도이다", () => {
    expect(toDeg(Math.PI / 2)).toBeCloseTo(90)
  })

  it("2π 라디안은 360도이다", () => {
    expect(toDeg(2 * Math.PI)).toBeCloseTo(360)
  })

  it("음수 라디안도 처리한다", () => {
    expect(toDeg(-Math.PI)).toBeCloseTo(-180)
  })
})

describe("headingBetween (두 점 사이 헤딩)", () => {
  it("북쪽으로 이동 시 0도를 반환한다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: 0, y: 10 }
    expect(headingBetween(a, b)).toBeCloseTo(0)
  })

  it("동쪽으로 이동 시 90도를 반환한다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: 10, y: 0 }
    expect(headingBetween(a, b)).toBeCloseTo(90)
  })

  it("남쪽으로 이동 시 180도를 반환한다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: 0, y: -10 }
    expect(headingBetween(a, b)).toBeCloseTo(180)
  })

  it("서쪽으로 이동 시 270도를 반환한다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: -10, y: 0 }
    expect(headingBetween(a, b)).toBeCloseTo(270)
  })

  it("대각선 방향도 계산한다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: 10, y: 10 }
    expect(headingBetween(a, b)).toBeCloseTo(45)
  })

  it("결과는 항상 0-360 범위이다", () => {
    const a = { x: 0, y: 0 }
    const b = { x: -10, y: -10 }
    const heading = headingBetween(a, b)
    expect(heading).toBeGreaterThanOrEqual(0)
    expect(heading).toBeLessThan(360)
  })
})

describe("norm180 (-180..180 정규화)", () => {
  it("0도는 0으로 유지된다", () => {
    expect(norm180(0)).toBe(0)
  })

  it("90도는 90으로 유지된다", () => {
    expect(norm180(90)).toBe(90)
  })

  it("-90도는 -90으로 유지된다", () => {
    expect(norm180(-90)).toBe(-90)
  })

  it("180도는 180으로 변환된다", () => {
    expect(norm180(180)).toBe(180)
  })

  it("-180도는 180으로 변환된다", () => {
    expect(norm180(-180)).toBe(180)
  })

  it("270도는 -90도로 변환된다", () => {
    expect(norm180(270)).toBe(-90)
  })

  it("360도는 0으로 변환된다", () => {
    expect(norm180(360)).toBe(0)
  })

  it("-270도는 90으로 변환된다", () => {
    expect(norm180(-270)).toBe(90)
  })

  it("540도는 180으로 변환된다", () => {
    expect(norm180(540)).toBe(180)
  })
})

describe("alphaFromTau (시간상수 → EMA 알파)", () => {
  it("tauSec이 0이면 1을 반환한다 (즉시 반응)", () => {
    expect(alphaFromTau(0, 1)).toBe(1)
  })

  it("tauSec이 음수이면 1을 반환한다", () => {
    expect(alphaFromTau(-1, 1)).toBe(1)
  })

  it("dtSec이 0이면 0에 가까운 값을 반환한다", () => {
    expect(alphaFromTau(1, 0)).toBeCloseTo(0)
  })

  it("dtSec이 tauSec과 같으면 약 0.632를 반환한다 (1 - 1/e)", () => {
    const expected = 1 - Math.exp(-1) // 약 0.632
    expect(alphaFromTau(1, 1)).toBeCloseTo(expected)
  })

  it("dtSec이 클수록 1에 가까워진다", () => {
    const alpha1 = alphaFromTau(1, 1)
    const alpha10 = alphaFromTau(1, 10)
    expect(alpha10).toBeGreaterThan(alpha1)
    expect(alpha10).toBeLessThanOrEqual(1)
  })

  it("결과는 항상 0-1 범위이다", () => {
    for (let tau = 0.1; tau <= 10; tau += 0.5) {
      for (let dt = 0.01; dt <= 1; dt += 0.1) {
        const alpha = alphaFromTau(tau, dt)
        expect(alpha).toBeGreaterThanOrEqual(0)
        expect(alpha).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe("buildVirtualTimeline", () => {
  describe("기본 동작", () => {
    it("빈 샘플 배열은 기본값을 반환한다", () => {
      const result = buildVirtualTimeline([], 0)
      expect(result.T).toEqual([0])
      expect(result.t0).toBe(0)
      expect(result.tN).toBe(0)
      expect(result.totalDist).toBe(0)
    })

    it("샘플이 1개이면 시작과 끝이 같다", () => {
      const samples = [createSample(0, 0, 0)]
      const result = buildVirtualTimeline(samples, 0)
      expect(result.t0).toBe(0)
      expect(result.tN).toBe(0)
    })

    it("여러 샘플로 타임라인을 생성한다", () => {
      const samples = [
        createSample(0, 0, 0),
        createSample(50, 50, 500),
        createSample(100, 100, 1000),
      ]
      const result = buildVirtualTimeline(samples, 1000)
      expect(result.T.length).toBe(3)
      expect(result.t0).toBe(0)
      expect(result.tN).toBeGreaterThan(0)
    })
  })

  describe("distance 모드", () => {
    it("거리에 비례하여 시간을 분배한다", () => {
      const samples = [
        createSample(0, 0, 0),
        createSample(50, 50, 500),
        createSample(100, 100, 1000),
      ]
      const result = buildVirtualTimeline(samples, 1000, {
        mode: "distance",
        virtualDurationMs: 10000,
      })

      // 첫 구간: 500m (50%), 두 번째 구간: 500m (50%)
      // 따라서 T[1]은 전체 시간의 50% 근처
      expect(result.T[1]).toBeCloseTo(5000, -2) // 약 5000ms
      expect(result.tN).toBeCloseTo(10000, -2)
    })
  })

  describe("pace 모드", () => {
    it("페이스에 따라 시간을 계산한다", () => {
      const samples = [
        createSample(0, 0, 0, 300), // 5'00"/km
        createSample(50, 50, 500, 300),
        createSample(100, 100, 1000, 300),
      ]
      const result = buildVirtualTimeline(samples, 1000, {
        mode: "pace",
      })

      expect(result.tN).toBeGreaterThan(0)
    })
  })

  describe("segDist 계산", () => {
    it("구간별 거리를 계산한다", () => {
      const samples = [
        createSample(0, 0, 0),
        createSample(50, 50, 500),
        createSample(100, 100, 1000),
      ]
      const result = buildVirtualTimeline(samples, 1000)

      expect(result.segDist.length).toBe(2)
      expect(result.segDist[0]).toBe(500) // 0 → 500
      expect(result.segDist[1]).toBe(500) // 500 → 1000
    })

    it("d 값이 없으면 haversine으로 근사한다", () => {
      const samples = [
        { x: 127.0, y: 37.5, d: NaN, p: 300, e: 50, c: 160, t: 0 },
        { x: 127.001, y: 37.501, d: NaN, p: 300, e: 50, c: 160, t: 0 },
      ]
      const result = buildVirtualTimeline(samples, 0)

      expect(result.segDist[0]).toBeGreaterThan(0)
    })
  })

  describe("totalDist 처리", () => {
    it("totalDistance 파라미터가 우선 사용된다", () => {
      const samples = [
        createSample(0, 0, 0),
        createSample(50, 50, 500),
      ]
      const result = buildVirtualTimeline(samples, 2000)

      expect(result.totalDist).toBe(2000)
    })

    it("totalDistance가 0이면 계산된 값을 사용한다", () => {
      const samples = [
        createSample(0, 0, 0),
        createSample(50, 50, 500),
      ]
      const result = buildVirtualTimeline(samples, 0)

      expect(result.totalDist).toBe(500)
    })
  })
})
