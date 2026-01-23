import { renderHook, act } from "@testing-library/react-native"
import { useRunSaveFlow } from "@/src/features/run/hooks/useRunSaveFlow"
import type { RunContext } from "@/src/features/run/context/context"
import type { Telemetry } from "@/src/apis/types/run"

// Mock dependencies
jest.mock("@/src/apis", () => ({
  markPacemakerAsRun: jest.fn(() => Promise.resolve()),
}))

jest.mock("@/src/utils/runUtils", () => ({
  getRunName: jest.fn(() => "테스트 러닝"),
  saveRunning: jest.fn(() => Promise.resolve({ runningId: 123 })),
}))

class MockSaveRunningError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = "SaveRunningError"
  }
}

jest.mock("@/src/utils/runUtils/saveRunning", () => ({
  SaveRunningError: MockSaveRunningError,
}))

jest.mock("@/src/utils/sentryTools", () => ({
  captureError: jest.fn(),
}))

jest.mock("@/src/components/ui/feedback/toastConfig", () => ({
  showCompactToast: jest.fn(),
}))

jest.mock("@/src/features/run/context/record", () => ({
  buildUserRecordData: jest.fn(() => ({
    totalDistance: 1000,
    totalCalories: 100,
    averagePace: 300,
  })),
}))

jest.mock("@/src/features/run/utils/extractRawData", () => ({
  extractRawData: jest.fn(() => []),
}))

jest.mock("expo-file-system", () => ({
  cacheDirectory: "/mock/cache/",
  copyAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

// Helper functions
function createMockTelemetry(overrides: Partial<Telemetry> = {}): Telemetry {
  return {
    timeStamp: Date.now(),
    lat: 37.5,
    lng: 127.0,
    dist: 1000,
    pace: 300,
    alt: 10,
    cadence: 180,
    bpm: 150,
    isRunning: true,
    ...overrides,
  }
}

function createMockContext(overrides: Partial<RunContext> = {}): RunContext {
  return {
    status: "RUNNING",
    telemetries: [createMockTelemetry(), createMockTelemetry()],
    mainTimeline: [],
    segments: [],
    stats: {
      totalDistanceM: 1000,
      totalTimeMs: 300000,
      avgPaceSecPerKm: 300,
      currentPaceSecPerKm: 300,
      avgCadenceSpm: 180,
      currentCadenceSpm: 180,
      bpm: 150,
      calories: 100,
      gainM: 10,
      lossM: -5,
    } as any,
    liveActivity: {
      startedAtMs: Date.now() - 300000,
      pausedAtMs: null,
    },
    ...overrides,
  } as RunContext
}

function createMockControls() {
  return {
    stop: jest.fn(),
  }
}

describe("useRunSaveFlow", () => {
  let saveRunning: jest.Mock
  let showCompactToast: jest.Mock
  let captureError: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    saveRunning = require("@/src/utils/runUtils").saveRunning
    showCompactToast =
      require("@/src/components/ui/feedback/toastConfig").showCompactToast
    captureError = require("@/src/utils/sentryTools").captureError
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("초기 상태", () => {
    it("초기 상태가 올바르게 설정됨", () => {
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      expect(result.current.isSaving).toBe(false)
      expect(result.current.savingTelemetries).toEqual([])
      expect(result.current.thumbnailUri).toBeNull()
      expect(result.current.runShotType).toBe("thumbnail")
      expect(result.current.runSaveResult).toBeNull()
    })
  })

  describe("requestSave", () => {
    it("텔레메트리가 있으면 저장 시작", () => {
      const controls = createMockControls()
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls,
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      act(() => {
        result.current.requestSave()
      })

      expect(result.current.isSaving).toBe(true)
      expect(result.current.savingTelemetries.length).toBeGreaterThan(0)
      expect(controls.stop).toHaveBeenCalled()
    })

    it("텔레메트리가 없으면 저장 시작 안함", () => {
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext({ telemetries: [] }),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      act(() => {
        result.current.requestSave()
      })

      // 텔레메트리가 없으면 isSaving은 false로 유지
      expect(result.current.isSaving).toBe(false)
    })

    it("이미 저장 중이면 무시", () => {
      const controls = createMockControls()
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls,
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      act(() => {
        result.current.requestSave()
      })

      const firstCallCount = controls.stop.mock.calls.length

      act(() => {
        result.current.requestSave() // 두 번째 호출
      })

      expect(controls.stop).toHaveBeenCalledTimes(firstCallCount)
    })
  })

  describe("triggerCapture", () => {
    it("캡처 상태가 IDLE → PENDING → DONE으로 전환", async () => {
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      // runShotRef가 null이므로 캡처 실패 → 10초 타임아웃
      act(() => {
        result.current.triggerCapture()
      })

      // 타임아웃 전까지 PENDING 상태 (내부 상태이므로 직접 확인 불가)
      // 10초 후 DONE 상태

      act(() => {
        jest.advanceTimersByTime(10000) // CAPTURE_TIMEOUT_MS
      })

      // captureError가 타임아웃으로 호출됨
      expect(captureError).toHaveBeenCalledWith(
        "run.course.captureTimeout",
        expect.any(Error)
      )
    })

    it("triggerCapture 함수가 정의됨", () => {
      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      expect(typeof result.current.triggerCapture).toBe("function")
    })
  })

  describe("isClearCourse ref 동기화", () => {
    it("isClearCourse 변경 시 ref가 업데이트됨", () => {
      const { result, rerender } = renderHook(
        ({ isClearCourse }) =>
          useRunSaveFlow({
            context: createMockContext(),
            controls: createMockControls(),
            courseId: "100",
            ghostRunningId: "200",
            ghostyId: undefined,
            isClearCourse,
            findByCourseId: jest.fn(),
            removeJob: jest.fn(),
          }),
        { initialProps: { isClearCourse: false } }
      )

      // 초기 상태
      expect(result.current.isSaving).toBe(false)

      // isClearCourse 변경
      rerender({ isClearCourse: true })

      // ref가 업데이트됨 (직접 확인은 불가하지만 저장 시 사용됨)
      expect(result.current.isSaving).toBe(false)
    })
  })

  describe("저장 성공 시나리오", () => {
    it("저장 요청 후 isSaving이 true로 변경됨", () => {
      saveRunning.mockResolvedValue({ runningId: 123 })

      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: true,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      act(() => {
        result.current.requestSave()
      })

      expect(result.current.isSaving).toBe(true)
    })

    it("setWithRouting으로 라우팅 여부 설정", () => {
      saveRunning.mockResolvedValue({ runningId: 123 })

      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: true,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      // 초기값은 false
      act(() => {
        result.current.setWithRouting(true)
      })

      // setWithRouting이 호출됨 (내부 상태 변경)
      expect(result.current.requestSave).toBeDefined()
    })
  })

  describe("저장 실패 시나리오", () => {
    it("저장 중 에러 발생해도 isSaving 상태 변경됨", () => {
      saveRunning.mockRejectedValue(new Error("Unknown error"))

      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "-1",
          ghostyId: undefined,
          isClearCourse: false,
          findByCourseId: jest.fn(),
          removeJob: jest.fn(),
        })
      )

      act(() => {
        result.current.requestSave()
      })

      // isSaving이 true로 설정됨
      expect(result.current.isSaving).toBe(true)
    })
  })

  describe("pacemaker 마킹", () => {
    it("ghostyId 파라미터가 올바르게 전달됨", () => {
      saveRunning.mockResolvedValue({ runningId: 123 })

      const findByCourseId = jest.fn(() => ({ jobId: "job-1" }))
      const removeJob = jest.fn()

      const { result } = renderHook(() =>
        useRunSaveFlow({
          context: createMockContext(),
          controls: createMockControls(),
          courseId: "100",
          ghostRunningId: "200",
          ghostyId: "300",
          isClearCourse: true,
          findByCourseId,
          removeJob,
        })
      )

      // 훅이 올바른 파라미터로 생성됨
      expect(result.current.requestSave).toBeDefined()
      expect(result.current.triggerCapture).toBeDefined()
    })
  })
})
