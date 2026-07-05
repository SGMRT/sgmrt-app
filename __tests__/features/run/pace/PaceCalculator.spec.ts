import { PaceCalculator } from "@/src/features/run/pace/PaceCalculator"

describe("PaceCalculator (윈도우 합산 기반)", () => {
  let calculator: PaceCalculator

  beforeEach(() => {
    calculator = new PaceCalculator()
  })

  it("노이즈 낀 정속 구간에서 편향 없이 실제 페이스를 계산한다", () => {
    // 실제 3.4m/s (294초/km) 정속, 델타는 노이즈로 크게 요동
    // 샘플별 역수 EMA는 Jensen 부등식으로 느린 쪽으로 편향되지만
    // 윈도우 합산(거리 합/시간 합)은 편향이 없어야 함
    const deltas = [2.2, 4.6, 2.2, 4.6, 2.2, 4.6, 2.2, 4.6, 2.2, 4.6]

    let pace: number | null = null
    deltas.forEach((delta, i) => {
      pace = calculator.calculate(delta, 1000, (i + 1) * 1000).currentPace
    })

    // 실제: 10초 / 34m = 294.1초/km
    expect(pace).not.toBeNull()
    expect(pace!).toBeGreaterThan(288)
    expect(pace!).toBeLessThan(300)
  })

  it("신호 유실 후 긴 dt의 단일 샘플로도 올바른 페이스를 계산한다", () => {
    // 정속 주행 후 30초 갭 (터널)
    for (let i = 1; i <= 5; i++) {
      calculator.calculate(3.33, 1000, i * 1000)
    }
    const result = calculator.calculate(100, 30000, 35000)

    // 30초 / 100m = 300초/km
    expect(result.currentPace).toBeGreaterThan(290)
    expect(result.currentPace!).toBeLessThan(310)
  })

  it("물리적으로 불가능한 페이스(90초/km 미만)는 거부하고 이전 값을 유지한다", () => {
    for (let i = 1; i <= 5; i++) {
      calculator.calculate(3.33, 1000, i * 1000)
    }
    const before = calculator.getCurrentPace()

    // 50m/1s = 20초/km (180km/h)
    const result = calculator.calculate(50, 1000, 6000)

    expect(result.currentPace).toBe(before)
  })

  it("이상치로 느린 페이스(20분/km 초과)는 거부하고 이전 값을 유지한다", () => {
    for (let i = 1; i <= 5; i++) {
      calculator.calculate(3.33, 1000, i * 1000)
    }
    const before = calculator.getCurrentPace()

    // 0.5m/1s = 2000초/km
    const result = calculator.calculate(0.5, 1000, 6000)

    expect(result.currentPace).toBe(before)
  })

  it("거리/시간이 0 이하면 이전 페이스를 유지한다", () => {
    expect(calculator.calculate(0, 1000, 1000).currentPace).toBeNull()

    calculator.calculate(3.33, 1000, 2000)
    const before = calculator.getCurrentPace()

    expect(calculator.calculate(0, 1000, 3000).currentPace).toBe(before)
    expect(calculator.calculate(3.33, 0, 4000).currentPace).toBe(before)
  })

  it("페이스 변화 시 윈도우(10초)가 지나면 새 페이스에 완전히 수렴한다", () => {
    // 300초/km에서 210초/km로 전환
    for (let i = 1; i <= 15; i++) {
      calculator.calculate(3.33, 1000, i * 1000)
    }
    let pace: number | null = null
    for (let i = 16; i <= 30; i++) {
      pace = calculator.calculate(4.76, 1000, i * 1000).currentPace
    }

    // 마지막 10초 윈도우는 전부 새 페이스 구간
    expect(pace!).toBeGreaterThan(205)
    expect(pace!).toBeLessThan(215)
  })

  it("5샘플 이상이면 isStable=true", () => {
    for (let i = 1; i <= 4; i++) {
      expect(calculator.calculate(3.33, 1000, i * 1000).isStable).toBe(false)
    }
    expect(calculator.calculate(3.33, 1000, 5000).isStable).toBe(true)
  })

  it("reset 후 상태가 초기화된다", () => {
    for (let i = 1; i <= 5; i++) {
      calculator.calculate(3.33, 1000, i * 1000)
    }
    calculator.reset()

    expect(calculator.getCurrentPace()).toBeNull()
    expect(calculator.isStable()).toBe(false)
  })
})
