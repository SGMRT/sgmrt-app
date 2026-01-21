import { buildUserRecordData } from "@/src/features/run/context/record"
import { RunningStats, DEFAULT_STATS } from "@/src/features/run/context/stats"

// 테스트용 RunningStats 생성
const createStats = (overrides: Partial<RunningStats> = {}): RunningStats => ({
  ...DEFAULT_STATS,
  ...overrides,
})

describe("buildUserRecordData", () => {
  describe("기본 변환", () => {
    it("기본 stats를 UserDashBoardData로 변환", () => {
      const stats = createStats({
        totalDistanceM: 5000,
        calories: 300,
        avgPaceSecPerKm: 360,
        avgCadenceSpm: 170,
        currentPaceSecPerKm: 350,
        bpm: 145,
        gainM: 50,
        lossM: -20,
      })

      const result = buildUserRecordData(stats)

      expect(result.totalDistance).toBe(5000)
      expect(result.totalCalories).toBe(300)
      expect(result.averagePace).toBe(360)
      expect(result.averageCadence).toBe(170)
      expect(result.recentPointsPace).toBe(350)
      expect(result.bpm).toBe(145)
      expect(result.totalElevationGain).toBe(50)
      expect(result.totalElevationLoss).toBe(-20)
    })

    it("음수값은 0 또는 최소값으로 변환", () => {
      const stats = createStats({
        totalDistanceM: -100,
        calories: -50,
        avgPaceSecPerKm: -10,
        avgCadenceSpm: -5,
        bpm: -1,
        gainM: -10,
      })

      const result = buildUserRecordData(stats)

      expect(result.totalDistance).toBe(0)
      expect(result.totalCalories).toBe(0)
      expect(result.averagePace).toBe(0)
      expect(result.averageCadence).toBe(0)
      expect(result.bpm).toBe(0)
      expect(result.totalElevationGain).toBe(0)
    })
  })

  describe("폴백 로직", () => {
    it("currentPaceSecPerKm이 없으면 avgPaceSecPerKm 사용", () => {
      const stats = createStats({
        currentPaceSecPerKm: null as any,
        avgPaceSecPerKm: 360,
      })

      const result = buildUserRecordData(stats)

      expect(result.recentPointsPace).toBe(360)
    })

    it("avgCadenceSpm이 없으면 currentCadenceSpm 사용", () => {
      const stats = createStats({
        avgCadenceSpm: null as any,
        currentCadenceSpm: 175,
      })

      const result = buildUserRecordData(stats)

      expect(result.averageCadence).toBe(175)
    })

    it("유한하지 않은 값은 기본값(0) 사용", () => {
      const stats = createStats({
        totalDistanceM: NaN,
        calories: Infinity,
        avgPaceSecPerKm: -Infinity,
      })

      const result = buildUserRecordData(stats)

      expect(result.totalDistance).toBe(0)
      expect(result.totalCalories).toBe(0)
      expect(result.averagePace).toBe(0)
    })
  })

  describe("반올림 옵션", () => {
    it("round=true면 값을 반올림", () => {
      const stats = createStats({
        totalDistanceM: 5000.789,
        calories: 300.456,
        avgPaceSecPerKm: 360.123,
        avgCadenceSpm: 170.567,
        currentPaceSecPerKm: 350.999,
        bpm: 145.8,
        gainM: 50.4,
        lossM: -20.6,
      })

      const result = buildUserRecordData(stats, { round: true })

      expect(result.totalDistance).toBe(5001)
      expect(result.totalCalories).toBe(300)
      expect(result.averagePace).toBe(360)
      expect(result.averageCadence).toBe(171)
      expect(result.recentPointsPace).toBe(351)
      expect(result.bpm).toBe(146)
      expect(result.totalElevationGain).toBe(50)
      expect(result.totalElevationLoss).toBe(-21)
    })

    it("decimals로 소수점 자릿수 지정", () => {
      const stats = createStats({
        totalDistanceM: 5000.789,
        calories: 300.456,
        avgPaceSecPerKm: 360.123,
      })

      const result = buildUserRecordData(stats, {
        round: true,
        decimals: {
          distance: 2,
          calories: 1,
          pace: 1,
        },
      })

      expect(result.totalDistance).toBe(5000.79)
      expect(result.totalCalories).toBe(300.5)
      expect(result.averagePace).toBe(360.1)
    })
  })

  describe("경계 조건", () => {
    it("모든 값이 0인 경우", () => {
      const stats = createStats()

      const result = buildUserRecordData(stats)

      expect(result.totalDistance).toBe(0)
      expect(result.totalCalories).toBe(0)
      expect(result.averagePace).toBe(0)
    })

    it("lossM은 음수로 유지", () => {
      const stats = createStats({
        lossM: -100,
      })

      const result = buildUserRecordData(stats)

      // lossM은 Math.min(0, x)으로 최대 0
      expect(result.totalElevationLoss).toBeLessThanOrEqual(0)
    })
  })
})
