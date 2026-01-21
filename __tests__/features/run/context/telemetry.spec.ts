import { buildTelemetry } from "@/src/features/run/context/telemetry"
import { RunningStats, DEFAULT_STATS } from "@/src/features/run/context/stats"
import { RawRunData } from "@/src/features/run/types"
import { Telemetry } from "@/src/apis/types/run"

// 테스트용 RawRunData 생성
const createSample = (overrides: Partial<RawRunData> = {}): RawRunData => ({
  timestamp: 1000,
  latitude: 37.5,
  longitude: 127.0,
  altitude: 50,
  pressure: 1013,
  steps: {
    totalSteps: 100,
    deltaSteps: 2,
    last5sSteps: 10,
    timestamp: 1000,
  },
  distance: 0,
  isRunning: true,
  bpm: 120,
  raw: {
    timestamp: 1000,
    latitude: 37.5,
    longitude: 127.0,
    accuracy: 10,
    altitude: 50,
    altitudeAccuracy: 5,
    speed: 3,
    course: 90,
    pressure: 1013,
  },
  ...overrides,
})

// 테스트용 RunningStats 생성
const createStats = (overrides: Partial<RunningStats> = {}): RunningStats => ({
  ...DEFAULT_STATS,
  totalDistanceM: 1000,
  currentPaceSecPerKm: 300,
  avgPaceSecPerKm: 310,
  currentCadenceSpm: 170,
  ...overrides,
})

// 테스트용 Telemetry 생성
const createTelemetry = (overrides: Partial<Telemetry> = {}): Telemetry => ({
  timeStamp: 500,
  lat: 37.499,
  lng: 126.999,
  dist: 500,
  pace: 280,
  alt: 45,
  cadence: 165,
  bpm: 130,
  isRunning: true,
  ...overrides,
})

describe("buildTelemetry", () => {
  describe("isRunning=true (러닝 중)", () => {
    it("기본 telemetry를 생성한다", () => {
      const stats = createStats()
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.lat).toBe(37.5)
      expect(result.lng).toBe(127.0)
      expect(result.isRunning).toBe(true)
    })

    it("timestamp를 sample에서 가져온다", () => {
      const stats = createStats()
      const sample = createSample({ timestamp: 2000 })

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.timeStamp).toBe(2000)
    })

    it("dist를 stats에서 계산한다 (소수점 2자리)", () => {
      const stats = createStats({ totalDistanceM: 1234.567 })
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.dist).toBe(1234.57)
    })

    it("pace를 stats에서 가져온다", () => {
      const stats = createStats({ currentPaceSecPerKm: 350 })
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.pace).toBe(350)
    })

    it("cadence를 stats에서 가져온다", () => {
      const stats = createStats({ currentCadenceSpm: 180 })
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.cadence).toBe(180)
    })

    it("altitude를 sample에서 가져온다", () => {
      const stats = createStats()
      const sample = createSample({ altitude: 75 })

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.alt).toBe(75)
    })

    it("bpm은 prev에서 가져온다", () => {
      const stats = createStats()
      const sample = createSample({ bpm: 150 })
      const prev = createTelemetry({ bpm: 140 })

      const result = buildTelemetry(stats, sample, prev, true)

      // bpm은 prev에서 가져옴 (sample.bpm은 무시)
      expect(result.bpm).toBe(140)
    })
  })

  describe("isRunning=false (일시정지)", () => {
    it("timestamp를 prev에서 가져온다", () => {
      const stats = createStats()
      const sample = createSample({ timestamp: 2000 })
      const prev = createTelemetry({ timeStamp: 1500 })

      const result = buildTelemetry(stats, sample, prev, false)

      expect(result.timeStamp).toBe(1500)
    })

    it("dist를 prev에서 가져온다", () => {
      const stats = createStats({ totalDistanceM: 1500 })
      const sample = createSample()
      const prev = createTelemetry({ dist: 1000 })

      const result = buildTelemetry(stats, sample, prev, false)

      expect(result.dist).toBe(1000)
    })

    it("pace를 prev에서 가져온다", () => {
      const stats = createStats({ currentPaceSecPerKm: 400 })
      const sample = createSample()
      const prev = createTelemetry({ pace: 350 })

      const result = buildTelemetry(stats, sample, prev, false)

      expect(result.pace).toBe(350)
    })

    it("cadence를 prev에서 가져온다", () => {
      const stats = createStats({ currentCadenceSpm: 200 })
      const sample = createSample()
      const prev = createTelemetry({ cadence: 175 })

      const result = buildTelemetry(stats, sample, prev, false)

      expect(result.cadence).toBe(175)
    })

    it("위치는 sample에서 가져온다 (일시정지 중에도 위치 추적)", () => {
      const stats = createStats()
      const sample = createSample({ latitude: 37.51, longitude: 127.01 })
      const prev = createTelemetry({ lat: 37.5, lng: 127.0 })

      const result = buildTelemetry(stats, sample, prev, false)

      expect(result.lat).toBe(37.51)
      expect(result.lng).toBe(127.01)
    })
  })

  describe("prev가 없을 때 기본값", () => {
    it("isRunning=false에서 timestamp 기본값은 0", () => {
      const stats = createStats()
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, false)

      expect(result.timeStamp).toBe(0)
    })

    it("isRunning=false에서 dist 기본값은 0", () => {
      const stats = createStats()
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, false)

      expect(result.dist).toBe(0)
    })

    it("isRunning=false에서 pace 기본값은 0", () => {
      const stats = createStats({ currentPaceSecPerKm: null as any })
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, false)

      expect(result.pace).toBe(0)
    })

    it("isRunning=false에서 cadence 기본값은 0", () => {
      const stats = createStats({ currentCadenceSpm: null as any })
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, false)

      expect(result.cadence).toBe(0)
    })

    it("altitude 기본값은 0", () => {
      const stats = createStats()
      const sample = createSample({ altitude: undefined })

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.alt).toBe(0)
    })

    it("bpm 기본값은 0", () => {
      const stats = createStats()
      const sample = createSample()

      const result = buildTelemetry(stats, sample, undefined, true)

      expect(result.bpm).toBe(0)
    })
  })

  describe("stats 값이 null일 때 prev fallback", () => {
    it("pace가 null이면 prev.pace를 사용한다", () => {
      const stats = createStats({ currentPaceSecPerKm: null as any })
      const sample = createSample()
      const prev = createTelemetry({ pace: 320 })

      const result = buildTelemetry(stats, sample, prev, true)

      expect(result.pace).toBe(320)
    })

    it("cadence가 null이면 prev.cadence를 사용한다", () => {
      const stats = createStats({ currentCadenceSpm: null as any })
      const sample = createSample()
      const prev = createTelemetry({ cadence: 160 })

      const result = buildTelemetry(stats, sample, prev, true)

      expect(result.cadence).toBe(160)
    })
  })

  describe("기본 isRunning 매개변수", () => {
    it("isRunning 기본값은 false이다", () => {
      const stats = createStats()
      const sample = createSample()

      const result = buildTelemetry(stats, sample)

      expect(result.isRunning).toBe(false)
    })
  })
})
