import {
  isRunningNow,
  PolylineSeg,
  selectLiveActivityPayload,
  selectPolylineSegments,
  selectStatsDisplay,
  selectUserLocation,
} from "@/src/features/run/context/selectors"
import { RunContext } from "@/src/features/run/context/context"
import { DEFAULT_STATS } from "@/src/features/run/context/stats"
import { Telemetry } from "@/src/apis/types/run"

// 테스트용 기본 컨텍스트 생성
const createMockContext = (
  overrides: Partial<RunContext> = {}
): RunContext => ({
  sessionId: "test-session",
  mode: "SOLO",
  status: "IDLE",
  userWeight: 70,
  mainTimeline: [],
  pausedBuffer: [],
  mutedBuffer: [],
  postCompleteBuffer: [],
  stats: { ...DEFAULT_STATS },
  telemetries: [],
  segments: [],
  liveActivity: {
    startedAtMs: null,
    pausedAtMs: null,
    message: null,
    messageType: null,
  },
  _zeroNextDt: false,
  ...overrides,
})

// 테스트용 텔레메트리 생성
const createTelemetry = (
  lat: number,
  lng: number,
  overrides: Partial<Telemetry> = {}
): Telemetry => ({
  timeStamp: Date.now(),
  lat,
  lng,
  dist: 0,
  pace: 300,
  alt: 50,
  cadence: 160,
  bpm: 140,
  isRunning: true,
  ...overrides,
})

describe("selectPolylineSegments", () => {
  it("빈 세그먼트는 빈 배열을 반환한다", () => {
    const ctx = createMockContext()
    const result = selectPolylineSegments(ctx)
    expect(result).toEqual([])
  })

  it("세그먼트를 폴리라인으로 변환한다", () => {
    const telemetries = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.001),
      createTelemetry(37.502, 127.002),
    ]
    const ctx = createMockContext({
      telemetries,
      segments: [{ start: 0, end: 2, isRunning: true }],
    })

    const result = selectPolylineSegments(ctx)

    expect(result).toHaveLength(1)
    expect(result[0].isRunning).toBe(true)
    expect(result[0].id).toBe("0-R")
    expect(result[0].points).toHaveLength(3)
    expect(result[0].points[0]).toEqual({ latitude: 37.5, longitude: 127.0 })
  })

  it("여러 세그먼트를 처리한다 (러닝/일시정지)", () => {
    const telemetries = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.001),
      createTelemetry(37.502, 127.002),
      createTelemetry(37.503, 127.003),
    ]
    const ctx = createMockContext({
      telemetries,
      segments: [
        { start: 0, end: 1, isRunning: true },
        { start: 2, end: 3, isRunning: false },
      ],
    })

    const result = selectPolylineSegments(ctx)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("0-R")
    expect(result[0].isRunning).toBe(true)
    expect(result[0].points).toHaveLength(2)
    expect(result[1].id).toBe("2-P")
    expect(result[1].isRunning).toBe(false)
    expect(result[1].points).toHaveLength(2)
  })

  it("텔레메트리가 없으면 빈 points를 반환한다", () => {
    const ctx = createMockContext({
      telemetries: [],
      segments: [{ start: 0, end: 2, isRunning: true }],
    })

    const result = selectPolylineSegments(ctx)

    expect(result).toHaveLength(1)
    expect(result[0].points).toHaveLength(0)
  })
})

describe("selectLiveActivityPayload", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2024-01-15T10:00:00.000Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("기본 페이로드를 반환한다", () => {
    const ctx = createMockContext({
      liveActivity: {
        startedAtMs: new Date("2024-01-15T09:30:00.000Z").getTime(),
        pausedAtMs: null,
        message: null,
        messageType: null,
      },
      stats: {
        ...DEFAULT_STATS,
        totalDistanceM: 5000,
        avgPaceSecPerKm: 300,
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.startedAtISO).toBe("2024-01-15T09:30:00.000Z")
    expect(result.pausedAtISO).toBeUndefined()
    expect(result.distanceMeters).toBe(5000)
    expect(result.recentPace).toBe(300)
    expect(result.progress).toBeUndefined()
    expect(result.message).toBeUndefined()
    expect(result.messageType).toBeUndefined()
  })

  it("일시정지 시간을 포함한다", () => {
    const ctx = createMockContext({
      liveActivity: {
        startedAtMs: new Date("2024-01-15T09:30:00.000Z").getTime(),
        pausedAtMs: new Date("2024-01-15T09:45:00.000Z").getTime(),
        message: null,
        messageType: null,
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.pausedAtISO).toBe("2024-01-15T09:45:00.000Z")
  })

  it("코스 모드에서 progress를 계산한다", () => {
    const ctx = createMockContext({
      mode: "COURSE",
      courseMetadata: {
        courseId: 1,
        courseName: "Test Course",
        distanceMeters: 10000,
        variant: "SOLO",
      },
      stats: {
        ...DEFAULT_STATS,
        totalDistanceM: 5000,
      },
      liveActivity: {
        startedAtMs: Date.now(),
        pausedAtMs: null,
        message: null,
        messageType: null,
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.progress).toBeCloseTo(0.5)
  })

  it("progress는 0-1 범위로 제한된다", () => {
    const ctx = createMockContext({
      mode: "COURSE",
      courseMetadata: {
        courseId: 1,
        courseName: "Test Course",
        distanceMeters: 5000,
        variant: "SOLO",
      },
      stats: {
        ...DEFAULT_STATS,
        totalDistanceM: 10000, // 코스 거리 초과
      },
      liveActivity: {
        startedAtMs: Date.now(),
        pausedAtMs: null,
        message: null,
        messageType: null,
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.progress).toBe(1)
  })

  it("마지막 텔레메트리의 페이스를 사용한다", () => {
    const ctx = createMockContext({
      telemetries: [createTelemetry(37.5, 127.0, { pace: 250 })],
      stats: {
        ...DEFAULT_STATS,
        avgPaceSecPerKm: 300,
      },
      liveActivity: {
        startedAtMs: Date.now(),
        pausedAtMs: null,
        message: null,
        messageType: null,
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.recentPace).toBe(250)
  })

  it("메시지 정보를 포함한다", () => {
    const ctx = createMockContext({
      liveActivity: {
        startedAtMs: Date.now(),
        pausedAtMs: null,
        message: "Good pace!",
        messageType: "info",
      },
    })

    const result = selectLiveActivityPayload(ctx)

    expect(result.message).toBe("Good pace!")
    expect(result.messageType).toBe("info")
  })
})

describe("isRunningNow", () => {
  it("RUNNING 상태는 true를 반환한다", () => {
    expect(isRunningNow("RUNNING")).toBe(true)
  })

  it("RUNNING_EXTENDED 상태는 true를 반환한다", () => {
    expect(isRunningNow("RUNNING_EXTENDED")).toBe(true)
  })

  it("IDLE 상태는 false를 반환한다", () => {
    expect(isRunningNow("IDLE")).toBe(false)
  })

  it("READY 상태는 false를 반환한다", () => {
    expect(isRunningNow("READY")).toBe(false)
  })

  it("PAUSED 상태는 false를 반환한다", () => {
    expect(isRunningNow("PAUSED")).toBe(false)
  })

  it("STOPPED 상태는 false를 반환한다", () => {
    expect(isRunningNow("STOPPED")).toBe(false)
  })

  it("MUTED 상태는 false를 반환한다", () => {
    expect(isRunningNow("MUTED")).toBe(false)
  })
})

describe("selectStatsDisplay", () => {
  it("기본 통계 표시 배열을 반환한다", () => {
    const ctx = createMockContext()
    const result = selectStatsDisplay(ctx)

    expect(result).toHaveLength(6)
    expect(result[0]).toEqual({ label: "거리", value: "0.00", unit: "km" })
    expect(result[1]).toEqual({ label: "현재 페이스", value: "-'-''", unit: "" })
    expect(result[2]).toEqual({ label: "케이던스", value: 0, unit: "spm" })
    expect(result[3]).toEqual({ label: "평균 페이스", value: "-'-''", unit: "" })
    expect(result[4]).toEqual({ label: "칼로리", value: 0, unit: "kcal" })
    expect(result[5]).toEqual({ label: "BPM", value: "--", unit: "" })
  })

  it("거리를 km로 변환한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        totalDistanceM: 5500,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[0].value).toBe("5.50")
  })

  it("페이스를 분/초 형식으로 포맷한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        currentPaceSecPerKm: 330, // 5'30"
        avgPaceSecPerKm: 300, // 5'00"
      },
    })

    const result = selectStatsDisplay(ctx)

    // 형식: X'YY" (분'초")
    expect(String(result[1].value)).toContain("5")
    expect(String(result[1].value)).toContain("30")
    expect(String(result[3].value)).toContain("5")
    expect(String(result[3].value)).toContain("00")
  })

  it("케이던스를 반올림한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        currentCadenceSpm: 167.8,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[2].value).toBe(168)
  })

  it("칼로리를 반올림한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        calories: 345.6,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[4].value).toBe(346)
  })

  it("BPM이 있으면 표시한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        bpm: 145,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[5].value).toBe(145)
  })

  it("유효하지 않은 페이스는 기본값을 반환한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        currentPaceSecPerKm: 0,
        avgPaceSecPerKm: -100,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[1].value).toBe("-'-''")
    expect(result[3].value).toBe("-'-''")
  })

  it("무한대 페이스는 기본값을 반환한다", () => {
    const ctx = createMockContext({
      stats: {
        ...DEFAULT_STATS,
        currentPaceSecPerKm: Infinity,
      },
    })

    const result = selectStatsDisplay(ctx)

    expect(result[1].value).toBe("-'-''")
  })
})

describe("selectUserLocation", () => {
  const createRawRunData = (lat: number, lng: number) => ({
    lat,
    lng,
    timestamp: Date.now(),
    altitude: 50,
    distance: 0,
    steps: null,
    bpm: null,
    isAccurate: true,
  })

  it("IDLE 상태에서는 null을 반환한다", () => {
    const ctx = createMockContext({ status: "IDLE" })
    const result = selectUserLocation(ctx)
    expect(result).toBeNull()
  })

  it("RUNNING 상태에서 mainTimeline의 마지막 위치를 반환한다", () => {
    const data = createRawRunData(37.5, 127.0)
    const ctx = createMockContext({
      status: "RUNNING",
      mainTimeline: [data],
    })

    const result = selectUserLocation(ctx)

    expect(result).toEqual(data)
  })

  it("PAUSED_USER 상태에서 pausedBuffer의 마지막 위치를 반환한다", () => {
    const mainData = createRawRunData(37.5, 127.0)
    const pausedData = createRawRunData(37.501, 127.001)
    const ctx = createMockContext({
      status: "PAUSED_USER",
      mainTimeline: [mainData],
      pausedBuffer: [pausedData],
    })

    const result = selectUserLocation(ctx)

    expect(result).toEqual(pausedData)
  })

  it("PAUSED_OFFCOURSE 상태에서 mutedBuffer의 마지막 위치를 반환한다", () => {
    const mutedData = createRawRunData(37.502, 127.002)
    const ctx = createMockContext({
      status: "PAUSED_OFFCOURSE",
      mutedBuffer: [mutedData],
    })

    const result = selectUserLocation(ctx)

    expect(result).toEqual(mutedData)
  })

  it("COMPLETION_PENDING 상태에서 postCompleteBuffer의 마지막 위치를 반환한다", () => {
    const postData = createRawRunData(37.503, 127.003)
    const ctx = createMockContext({
      status: "COMPLETION_PENDING",
      postCompleteBuffer: [postData],
    })

    const result = selectUserLocation(ctx)

    expect(result).toEqual(postData)
  })

  it("버퍼가 비어있으면 null을 반환한다", () => {
    const ctx = createMockContext({
      status: "RUNNING",
      mainTimeline: [],
    })

    const result = selectUserLocation(ctx)

    expect(result).toBeNull()
  })

  it("여러 데이터 중 마지막 것을 반환한다", () => {
    const data1 = createRawRunData(37.5, 127.0)
    const data2 = createRawRunData(37.501, 127.001)
    const data3 = createRawRunData(37.502, 127.002)
    const ctx = createMockContext({
      status: "RUNNING",
      mainTimeline: [data1, data2, data3],
    })

    const result = selectUserLocation(ctx)

    expect(result).toEqual(data3)
  })
})
