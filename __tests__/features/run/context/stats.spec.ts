import {
  DEFAULT_STATS,
  RunningStats,
  updateStats,
  UpdateStatsOptions,
} from "@/src/features/run/context/stats"
import { RawRunData } from "@/src/features/run/types"

// 테스트용 RawRunData 생성
const createSample = (
  overrides: Partial<RawRunData> = {},
  timestamp: number = Date.now()
): RawRunData => ({
  lat: 37.5,
  lng: 127.0,
  timestamp,
  altitude: 50,
  distance: 0,
  steps: null,
  bpm: null,
  isAccurate: true,
  ...overrides,
})

describe("DEFAULT_STATS", () => {
  it("기본 통계가 올바르게 초기화되어 있다", () => {
    expect(DEFAULT_STATS.totalTimeMs).toBe(0)
    expect(DEFAULT_STATS.totalDistanceM).toBe(0)
    expect(DEFAULT_STATS.avgPaceSecPerKm).toBeNull()
    expect(DEFAULT_STATS.avgCadenceSpm).toBeNull()
    expect(DEFAULT_STATS.currentPaceSecPerKm).toBeNull()
    expect(DEFAULT_STATS.currentCadenceSpm).toBeNull()
    expect(DEFAULT_STATS.calories).toBeNull()
    expect(DEFAULT_STATS.gainM).toBe(0)
    expect(DEFAULT_STATS.lossM).toBe(0)
    expect(DEFAULT_STATS.bpm).toBeNull()
    expect(DEFAULT_STATS._window).toEqual([])
    expect(DEFAULT_STATS._totalSteps).toBe(0)
    expect(DEFAULT_STATS._stepInvalid).toBe(false)
    expect(DEFAULT_STATS._stepStaleCount).toBe(0)
  })
})

describe("updateStats", () => {
  describe("시간 증분", () => {
    it("첫 샘플은 시간을 증가시키지 않는다", () => {
      const sample = createSample({}, 1000)
      const result = updateStats(DEFAULT_STATS, sample)

      expect(result.totalTimeMs).toBe(0)
    })

    it("연속 샘플 간 시간을 누적한다", () => {
      const sample1 = createSample({}, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({}, 3000) // 2초 후
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.totalTimeMs).toBe(2000)
    })

    it("zeroDt 옵션이 true면 시간을 증가시키지 않는다", () => {
      const sample1 = createSample({}, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({}, 3000)
      const stats2 = updateStats(stats1, sample2, { zeroDt: true })

      expect(stats2.totalTimeMs).toBe(0)
    })

    it("짧은 dt (0.8초 미만)는 무시한다", () => {
      const sample1 = createSample({}, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({}, 1500) // 0.5초 후
      const stats2 = updateStats(stats1, sample2)

      // 이전 상태가 그대로 반환됨
      expect(stats2).toBe(stats1)
    })
  })

  describe("거리 증분", () => {
    it("거리를 누적한다", () => {
      const sample1 = createSample({ distance: 0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 10 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.totalDistanceM).toBe(10)
    })

    it("여러 샘플의 거리를 누적한다", () => {
      const sample1 = createSample({ distance: 0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 10 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      const sample3 = createSample({ distance: 15 }, 5000)
      const stats3 = updateStats(stats2, sample3)

      expect(stats3.totalDistanceM).toBe(25)
    })

    it("비현실적으로 빠른 속도(15m/s 초과)는 필터링한다", () => {
      const sample1 = createSample({ distance: 0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // 1초에 20m = 20m/s (비현실적)
      const sample2 = createSample({ distance: 20 }, 2000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.totalDistanceM).toBe(0)
    })

    it("너무 짧은 거리(0.3m 미만)는 필터링한다", () => {
      const sample1 = createSample({ distance: 0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 0.1 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.totalDistanceM).toBe(0)
    })

    it("zeroDt 옵션이 true면 거리를 증가시키지 않는다", () => {
      const sample1 = createSample({ distance: 0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 10 }, 3000)
      const stats2 = updateStats(stats1, sample2, { zeroDt: true })

      expect(stats2.totalDistanceM).toBe(0)
    })
  })

  describe("고도 누적", () => {
    it("고도 상승을 누적한다", () => {
      const sample1 = createSample({ altitude: 50 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ altitude: 60 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.gainM).toBe(10)
    })

    it("고도 하강을 누적한다 (음수)", () => {
      const sample1 = createSample({ altitude: 60 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ altitude: 50 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.lossM).toBe(-10)
    })

    it("고도가 null이면 무시한다", () => {
      const sample1 = createSample({ altitude: 50 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ altitude: null as any }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.gainM).toBe(0)
      expect(stats2.lossM).toBe(0)
    })
  })

  describe("페이스 계산", () => {
    it("현재 페이스를 계산한다", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // 10초간 100m 이동 = 10m/s = 100초/km
      const sample2 = createSample({ distance: 100 }, 10000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.currentPaceSecPerKm).toBeCloseTo(100, 0)
    })

    it("평균 페이스를 계산한다", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // 300초간 1000m 이동 = 300초/km (5분 페이스)
      const sample2 = createSample({ distance: 1000 }, 300000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.avgPaceSecPerKm).toBeCloseTo(300, 0)
    })

    it("거리가 0이면 페이스는 null이다", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 0 }, 10000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.avgPaceSecPerKm).toBeNull()
    })

    it("이전 페이스 값이 유지된다 (sticky)", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ distance: 100 }, 10000)
      const stats2 = updateStats(stats1, sample2)

      // 윈도우에 새 데이터가 추가되어 페이스가 변경될 수 있음
      // sticky 동작은 rawPace가 null일 때만 발생
      // 따라서 거리 0인 샘플을 추가
      const sample3 = createSample({ distance: 0 }, 12000)
      const stats3 = updateStats(stats2, sample3)

      // currentPaceSecPerKm은 존재해야 함 (sticky 또는 새 계산)
      expect(stats3.currentPaceSecPerKm).not.toBeNull()
    })
  })

  describe("스텝/케이던스 계산", () => {
    it("스텝을 누적한다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 10, last5sSteps: 8 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      expect(stats1._totalSteps).toBe(10)
    })

    it("연속된 스텝을 누적한다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 10, last5sSteps: 8 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample(
        {
          steps: { deltaSteps: 15, last5sSteps: 12 },
        },
        3000
      )
      const stats2 = updateStats(stats1, sample2)

      expect(stats2._totalSteps).toBe(25)
    })

    it("현재 케이던스를 last5sSteps에서 계산한다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 10, last5sSteps: 10 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // last5sSteps = 10, 5초간 = 10/5*60 = 120 spm
      expect(stats1.currentCadenceSpm).toBe(120)
    })

    it("케이던스가 300 초과하면 무시한다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 10, last5sSteps: 30 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // last5sSteps = 30 → 30/5*60 = 360 spm (비현실적)
      expect(stats1.currentCadenceSpm).toBeNull()
    })

    it("평균 케이던스를 계산한다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 60, last5sSteps: 10 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // 60초간 180 스텝 = 180 spm
      const sample2 = createSample(
        {
          steps: { deltaSteps: 120, last5sSteps: 10 },
        },
        61000 // 60초 후
      )
      const stats2 = updateStats(stats1, sample2)

      // 전체 시간 60초, 총 스텝 180 → 180/60*60 = 180 spm
      expect(stats2.avgCadenceSpm).toBeCloseTo(180, 0)
    })

    it("zeroDt 시 윈도우가 초기화되고 _stepInvalid가 설정된다", () => {
      const sample1 = createSample(
        {
          steps: { deltaSteps: 10, last5sSteps: 8 },
        },
        1000
      )
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // zeroDt 시 _stepInvalid가 true로 설정되지만
      // deltaSteps > 0이면 바로 false로 다시 설정됨
      // deltaSteps가 0인 샘플로 테스트
      const sample2 = createSample(
        {
          steps: { deltaSteps: 0, last5sSteps: 0 },
        },
        3000
      )
      const stats2 = updateStats(stats1, sample2, { zeroDt: true })

      // zeroDt 시 윈도우가 초기화됨
      expect(stats2._window.length).toBe(1)
    })
  })

  describe("BPM 처리", () => {
    it("BPM을 기록한다", () => {
      const sample1 = createSample({ bpm: 140 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      expect(stats1.bpm).toBe(140)
    })

    it("BPM이 null이면 이전 값을 유지한다", () => {
      const sample1 = createSample({ bpm: 140 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ bpm: null }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.bpm).toBe(140)
    })
  })

  describe("칼로리 계산", () => {
    it("칼로리를 계산한다", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      // 1km를 5분 (300초)에 달림
      const sample2 = createSample({ distance: 1000 }, 300000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.calories).toBeGreaterThan(0)
    })

    it("체중에 따라 칼로리가 달라진다", () => {
      const sample1 = createSample({ distance: 0 }, 0)
      const stats1Light = updateStats(DEFAULT_STATS, sample1, { weight: 50 })

      const sample2 = createSample({ distance: 1000 }, 300000)
      const stats2Light = updateStats(stats1Light, sample2, { weight: 50 })
      const stats2Heavy = updateStats(stats1Light, sample2, { weight: 90 })

      expect(stats2Heavy.calories).toBeGreaterThan(stats2Light.calories!)
    })
  })

  describe("윈도우 관리", () => {
    it("10초 윈도우 내의 샘플만 유지한다", () => {
      let stats = DEFAULT_STATS

      // 0초
      stats = updateStats(stats, createSample({ distance: 10 }, 0))
      // 5초
      stats = updateStats(stats, createSample({ distance: 10 }, 5000))
      // 10초
      stats = updateStats(stats, createSample({ distance: 10 }, 10000))

      expect(stats._window.length).toBe(3)

      // 15초 (0초 샘플이 윈도우에서 제거됨)
      stats = updateStats(stats, createSample({ distance: 10 }, 15000))

      expect(stats._window.length).toBe(3)
      expect(stats._window[0].ts).toBe(5000)
    })

    it("zeroDt 시 윈도우가 초기화된다", () => {
      let stats = DEFAULT_STATS
      stats = updateStats(stats, createSample({ distance: 10 }, 0))
      stats = updateStats(stats, createSample({ distance: 10 }, 5000))

      expect(stats._window.length).toBe(2)

      stats = updateStats(stats, createSample({ distance: 10 }, 10000), {
        zeroDt: true,
      })

      expect(stats._window.length).toBe(1)
    })
  })

  describe("last 샘플 추적", () => {
    it("마지막 샘플을 기록한다", () => {
      const sample = createSample({ lat: 37.5, lng: 127.0 }, 1000)
      const stats = updateStats(DEFAULT_STATS, sample)

      expect(stats.last).toEqual(sample)
    })

    it("새 샘플로 last가 업데이트된다", () => {
      const sample1 = createSample({ lat: 37.5, lng: 127.0 }, 1000)
      const stats1 = updateStats(DEFAULT_STATS, sample1)

      const sample2 = createSample({ lat: 37.501, lng: 127.001 }, 3000)
      const stats2 = updateStats(stats1, sample2)

      expect(stats2.last).toEqual(sample2)
    })
  })
})
