import { DistanceAccumulator } from "@/src/features/run/distance/DistanceAccumulator"

const LAT_PER_M = 1 / 111320

const position = (northM: number) => ({
  latitude: 37.5 + northM * LAT_PER_M,
  longitude: 127.0,
})

describe("DistanceAccumulator", () => {
  let accumulator: DistanceAccumulator

  beforeEach(() => {
    accumulator = new DistanceAccumulator()
  })

  it("첫 포인트는 거리 0으로 앵커만 설정한다", () => {
    const result = accumulator.accumulate(position(0), 0.9, "RUNNING", 0)
    expect(result.delta).toBe(0)
    expect(result.total).toBe(0)
  })

  it("이동 거리를 누적한다", () => {
    accumulator.accumulate(position(0), 0.9, "RUNNING", 0)
    accumulator.accumulate(position(9), 0.9, "RUNNING", 3000)
    const result = accumulator.accumulate(position(18), 0.9, "RUNNING", 6000)

    expect(result.total).toBeGreaterThan(15)
    expect(result.total).toBeLessThan(21)
  })

  it("STATIONARY 상태에서는 거리를 누적하지 않는다", () => {
    accumulator.accumulate(position(0), 0.9, "RUNNING", 0)
    accumulator.accumulate(position(9), 0.9, "RUNNING", 3000)
    const result = accumulator.accumulate(position(12), 0.9, "STATIONARY", 6000)

    expect(result.delta).toBe(0)
  })

  describe("reanchor", () => {
    it("재앵커 시 이전 위치와의 거리를 누적하지 않는다", () => {
      accumulator.accumulate(position(0), 0.9, "RUNNING", 0)
      accumulator.accumulate(position(9), 0.9, "RUNNING", 3000)
      const totalBefore = accumulator.getTotalDistance()

      // GPS 재배치: 500m 떨어진 곳으로 재앵커
      accumulator.reanchor(position(509), 33000)
      const result = accumulator.accumulate(position(512), 0.9, "RUNNING", 36000)

      // 500m 점프는 누적되지 않고, 재앵커 이후 3m만 누적
      expect(result.total).toBeLessThan(totalBefore + 10)
      expect(result.total).toBeGreaterThan(totalBefore)
    })
  })
})
