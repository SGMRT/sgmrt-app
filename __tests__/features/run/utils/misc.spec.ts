import { pressureAltitudeM } from "@/src/features/run/utils/pressureAltitudeM"
import { mapRunType } from "@/src/features/run/utils/mapRunType"
import { getElapsedMs } from "@/src/features/run/context/time"

describe("pressureAltitudeM", () => {
  it("기압이 없으면 altitude를 반환한다", () => {
    expect(pressureAltitudeM(undefined, 100)).toBe(100)
    expect(pressureAltitudeM(null, 100)).toBe(100)
    expect(pressureAltitudeM(0, 100)).toBe(100)
  })

  it("기압과 altitude가 모두 없으면 null 반환", () => {
    expect(pressureAltitudeM(undefined, undefined)).toBeNull()
    expect(pressureAltitudeM(null, null)).toBeNull()
  })

  it("표준 기압(1013.25)에서 고도 0", () => {
    const altitude = pressureAltitudeM(1013.25)
    expect(altitude).toBeCloseTo(0, 1)
  })

  it("낮은 기압에서 높은 고도 반환", () => {
    // 약 900hPa → 약 1000m
    const altitude = pressureAltitudeM(900)
    expect(altitude).toBeGreaterThan(900)
    expect(altitude).toBeLessThan(1200)
  })

  it("높은 기압에서 낮은 (음수) 고도 반환", () => {
    // 1050hPa → 약 -300m (해수면 아래)
    const altitude = pressureAltitudeM(1050)
    expect(altitude).toBeLessThan(0)
  })

  it("실제 서울 기압 테스트 (~1000hPa, ~100m)", () => {
    const altitude = pressureAltitudeM(1000)
    expect(altitude).toBeGreaterThan(100)
    expect(altitude).toBeLessThan(150)
  })
})

describe("mapRunType", () => {
  it("SOLO 모드는 SOLO 반환", () => {
    expect(mapRunType("SOLO")).toBe("SOLO")
    expect(mapRunType("SOLO", undefined)).toBe("SOLO")
    expect(mapRunType("SOLO", "GHOST")).toBe("SOLO") // variant 무시
  })

  it("COURSE 모드 + GHOST variant는 GHOST 반환", () => {
    expect(mapRunType("COURSE", "GHOST")).toBe("GHOST")
  })

  it("COURSE 모드 + SOLO variant는 COURSE 반환", () => {
    expect(mapRunType("COURSE", "SOLO")).toBe("COURSE")
  })

  it("COURSE 모드 + variant 없음은 COURSE 반환", () => {
    expect(mapRunType("COURSE")).toBe("COURSE")
    expect(mapRunType("COURSE", undefined)).toBe("COURSE")
  })
})

describe("getElapsedMs", () => {
  it("시작 시간이 없으면 0 반환", () => {
    expect(getElapsedMs(0, null, 5000)).toBe(0)
  })

  it("일시정지 없이 경과 시간 계산", () => {
    const started = 1000
    const now = 5000
    expect(getElapsedMs(started, null, now)).toBe(4000)
  })

  it("일시정지 중이면 일시정지 시점까지의 경과 시간", () => {
    const started = 1000
    const paused = 3000
    const now = 10000
    // paused 기준으로 계산
    expect(getElapsedMs(started, paused, now)).toBe(2000)
  })

  it("결과는 최소 0", () => {
    // 시작 시간이 현재보다 미래인 비정상 케이스
    expect(getElapsedMs(10000, null, 5000)).toBe(0)
  })

  it("시작과 동시에 일시정지하면 0", () => {
    const started = 1000
    const paused = 1000
    expect(getElapsedMs(started, paused, 5000)).toBe(0)
  })
})
