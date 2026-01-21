import { renderHook, act } from "@testing-library/react-native"
import { useCourseProgress } from "@/src/features/course/hooks/useCourseProgress"
import { RunContext } from "@/src/features/run/context/context"
import { Telemetry } from "@/src/apis/types/run"
import { Checkpoint } from "@/src/apis/types/course"
import { DEFAULT_STATS } from "@/src/features/run/context/stats"

// voice 모킹
jest.mock("@/src/features/audio/voice", () => ({
  voice: {
    dispatch: jest.fn(),
  },
}))

// Toast 모킹은 jest.setup.js에서 이미 설정됨

// 테스트 헬퍼: Telemetry 생성
const createTelemetry = (
  lat: number,
  lng: number,
  timeStamp: number = Date.now()
): Telemetry => ({
  lat,
  lng,
  alt: 50,
  timeStamp,
  dist: 0,
  pace: 300,
  cadence: 160,
  bpm: 120,
  isRunning: true,
})

// 테스트 헬퍼: Checkpoint 생성
const createCheckpoint = (lat: number, lng: number, name?: string): Checkpoint => ({
  lat,
  lng,
  name: name ?? `CP_${lat}_${lng}`,
  isNameFromAddress: false,
  nameFromUser: name,
})

// 테스트 헬퍼: Controls 모킹
const createMockControls = () => ({
  start: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(),
  complete: jest.fn(),
  offcourse: jest.fn(),
  oncourse: jest.fn(),
  extend: jest.fn(),
  setLiveActivityMessage: jest.fn(),
})

// 테스트 헬퍼: 기본 RunContext 생성
const createBaseContext = (overrides?: Partial<RunContext>): RunContext => ({
  sessionId: "test-session",
  mode: "COURSE",
  variant: "GHOST",
  courseMetadata: { distanceMeters: 5000 },
  status: "READY",
  userWeight: 70,
  mainTimeline: [],
  pausedBuffer: [],
  mutedBuffer: [],
  postCompleteBuffer: [],
  stats: DEFAULT_STATS,
  telemetries: [],
  segments: [],
  _zeroNextDt: false,
  liveActivity: {
    startedAtMs: null,
    pausedAtMs: null,
    message: null,
    messageType: null,
  },
  ...overrides,
})

// 직선 코스 생성 (시작점 → 끝점)
const createStraightCourse = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  points: number = 10
): Telemetry[] => {
  const result: Telemetry[] = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    result.push(
      createTelemetry(
        startLat + (endLat - startLat) * t,
        startLng + (endLng - startLng) * t,
        Date.now() + i * 1000
      )
    )
  }
  return result
}

describe("useCourseProgress", () => {
  let mockControls: ReturnType<typeof createMockControls>
  let mockOnStart: jest.Mock
  let mockOnForceStop: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockControls = createMockControls()
    mockOnStart = jest.fn()
    mockOnForceStop = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("초기화", () => {
    it("initializeCourse로 코스를 초기화할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      const course = createStraightCourse(37.5, 127.0, 37.51, 127.01)
      const checkpoints = [
        createCheckpoint(37.5, 127.0, "시작"),
        createCheckpoint(37.51, 127.01, "끝"),
      ]

      act(() => {
        result.current.initializeCourse(course, checkpoints)
      })

      expect(result.current.legs.length).toBeGreaterThan(0)
      expect(result.current.legIndex).toBe(0)
    })

    it("초기 상태에서 isCompleted는 false이다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(result.current.isCompleted).toBe(false)
    })

    it("초기 상태에서 legIndex는 0이다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(result.current.legIndex).toBe(0)
    })
  })

  describe("READY 상태에서 시작", () => {
    it("시작점 근처에 도달하면 onStart가 호출된다", () => {
      // 시작점에서 가까운 위치
      const context = createBaseContext({
        status: "READY",
        mutedBuffer: [
          {
            timestamp: Date.now(),
            latitude: 37.5,
            longitude: 127.0,
            altitude: 50,
            pressure: 1013,
            steps: {
              totalSteps: 0,
              deltaSteps: 0,
              last5sSteps: 0,
              timestamp: Date.now(),
            },
            distance: 0,
            isRunning: false,
            bpm: null,
            raw: {
              timestamp: Date.now(),
              latitude: 37.5,
              longitude: 127.0,
              accuracy: 10,
              altitude: 50,
              altitudeAccuracy: 5,
              speed: 0,
              course: 0,
              pressure: 1013,
            },
          },
        ],
      })

      const { result, rerender } = renderHook(
        ({ ctx }) =>
          useCourseProgress({
            context: ctx,
            controls: mockControls,
            onStart: mockOnStart,
            onForceStop: mockOnForceStop,
            startEnterM: 25,
          }),
        { initialProps: { ctx: context } }
      )

      const course = createStraightCourse(37.5, 127.0, 37.51, 127.01)
      const checkpoints = [
        createCheckpoint(37.5, 127.0, "시작"),
        createCheckpoint(37.51, 127.01, "끝"),
      ]

      act(() => {
        result.current.initializeCourse(course, checkpoints)
      })

      // 위치 업데이트 트리거 (시작점과 동일한 위치)
      const updatedContext = createBaseContext({
        ...context,
        mutedBuffer: [
          {
            timestamp: Date.now(),
            latitude: 37.5001, // 시작점에서 약 10m
            longitude: 127.0001,
            altitude: 50,
            pressure: 1013,
            steps: {
              totalSteps: 0,
              deltaSteps: 0,
              last5sSteps: 0,
              timestamp: Date.now(),
            },
            distance: 0,
            isRunning: false,
            bpm: null,
            raw: {
              timestamp: Date.now(),
              latitude: 37.5001,
              longitude: 127.0001,
              accuracy: 10,
              altitude: 50,
              altitudeAccuracy: 5,
              speed: 0,
              course: 0,
              pressure: 1013,
            },
          },
        ],
      })

      rerender({ ctx: updatedContext })

      expect(mockOnStart).toHaveBeenCalled()
    })
  })

  describe("오프코스 감지", () => {
    it("RUNNING 상태에서 코스에서 벗어나면 offcourse가 호출된다", () => {
      const context = createBaseContext({
        status: "RUNNING",
        mainTimeline: [
          {
            timestamp: Date.now(),
            latitude: 37.52, // 코스에서 멀리 떨어진 위치
            longitude: 127.02,
            altitude: 50,
            pressure: 1013,
            steps: {
              totalSteps: 100,
              deltaSteps: 2,
              last5sSteps: 10,
              timestamp: Date.now(),
            },
            distance: 100,
            isRunning: true,
            bpm: 120,
            raw: {
              timestamp: Date.now(),
              latitude: 37.52,
              longitude: 127.02,
              accuracy: 10,
              altitude: 50,
              altitudeAccuracy: 5,
              speed: 3,
              course: 90,
              pressure: 1013,
            },
          },
        ],
      })

      const { result, rerender } = renderHook(
        ({ ctx }) =>
          useCourseProgress({
            context: ctx,
            controls: mockControls,
            onStart: mockOnStart,
            onForceStop: mockOnForceStop,
            offEnterM: 50,
          }),
        { initialProps: { ctx: context } }
      )

      // 코스 초기화
      const course = createStraightCourse(37.5, 127.0, 37.51, 127.01)
      const checkpoints = [
        createCheckpoint(37.5, 127.0, "시작"),
        createCheckpoint(37.51, 127.01, "끝"),
      ]

      act(() => {
        result.current.initializeCourse(course, checkpoints)
      })

      // 코스에서 멀리 떨어진 위치로 업데이트
      const farFromCourse = createBaseContext({
        ...context,
        mainTimeline: [
          {
            timestamp: Date.now(),
            latitude: 37.55, // 코스에서 ~5km 떨어진 위치
            longitude: 127.05,
            altitude: 50,
            pressure: 1013,
            steps: {
              totalSteps: 100,
              deltaSteps: 2,
              last5sSteps: 10,
              timestamp: Date.now(),
            },
            distance: 100,
            isRunning: true,
            bpm: 120,
            raw: {
              timestamp: Date.now(),
              latitude: 37.55,
              longitude: 127.05,
              accuracy: 10,
              altitude: 50,
              altitudeAccuracy: 5,
              speed: 3,
              course: 90,
              pressure: 1013,
            },
          },
        ],
      })

      rerender({ ctx: farFromCourse })

      expect(mockControls.offcourse).toHaveBeenCalled()
    })
  })

  describe("오프코스 상태 관리", () => {
    it("PAUSED_OFFCOURSE 상태에서 setLiveActivityMessage가 호출된다", () => {
      const context = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(mockControls.setLiveActivityMessage).toHaveBeenCalledWith(
        "코스를 이탈하였습니다",
        "WARNING"
      )
    })

    it("오프코스 상태에서 10분 후 자동 종료된다", () => {
      const context = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      // 10분 경과
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000)
      })

      expect(mockOnForceStop).toHaveBeenCalled()
    })

    it("오프코스 상태에서 복귀하면 타이머가 정리된다", () => {
      const context = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      const { rerender } = renderHook(
        ({ ctx }) =>
          useCourseProgress({
            context: ctx,
            controls: mockControls,
            onStart: mockOnStart,
            onForceStop: mockOnForceStop,
          }),
        { initialProps: { ctx: context } }
      )

      // 5분 경과
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000)
      })

      // RUNNING 상태로 복귀
      const runningContext = createBaseContext({
        status: "RUNNING",
      })

      rerender({ ctx: runningContext })

      // 추가 5분 경과
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000)
      })

      // 타이머가 정리되었으므로 onForceStop은 호출되지 않음
      expect(mockOnForceStop).not.toHaveBeenCalled()
    })
  })

  describe("온코스 복귀", () => {
    it("offcourseAnchor를 반환한다", () => {
      const context = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      // offcourseAnchor 속성이 존재하는지 확인
      expect("offcourseAnchor" in result.current).toBe(true)
    })

    it("RUNNING 상태로 복귀 시 setLiveActivityMessage가 null로 설정된다", () => {
      // 먼저 오프코스 상태로 시작
      const offcourseContext = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      const { rerender } = renderHook(
        ({ ctx }) =>
          useCourseProgress({
            context: ctx,
            controls: mockControls,
            onStart: mockOnStart,
            onForceStop: mockOnForceStop,
          }),
        { initialProps: { ctx: offcourseContext } }
      )

      // RUNNING 상태로 변경
      const runningContext = createBaseContext({
        status: "RUNNING",
      })

      rerender({ ctx: runningContext })

      // 오프코스 상태가 해제될 때 메시지가 null로 설정됨
      expect(mockControls.setLiveActivityMessage).toHaveBeenCalledWith(null, null)
    })
  })

  describe("반환값", () => {
    it("legs 배열을 반환한다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(Array.isArray(result.current.legs)).toBe(true)
    })

    it("legIndex를 반환한다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(typeof result.current.legIndex).toBe("number")
    })

    it("isOffcourse를 반환한다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(typeof result.current.isOffcourse).toBe("boolean")
    })

    it("isCompleted를 반환한다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(typeof result.current.isCompleted).toBe("boolean")
    })

    it("initializeCourse 함수를 반환한다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      expect(typeof result.current.initializeCourse).toBe("function")
    })
  })

  describe("커스텀 설정", () => {
    it("guideAdvanceM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          guideAdvanceM: 100,
        })
      )

      // 훅이 에러 없이 초기화됨
      expect(result.current).toBeDefined()
    })

    it("startEnterM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          startEnterM: 50,
        })
      )

      expect(result.current).toBeDefined()
    })

    it("offEnterM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          offEnterM: 75,
        })
      )

      expect(result.current).toBeDefined()
    })

    it("offReturnM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          offReturnM: 25,
        })
      )

      expect(result.current).toBeDefined()
    })

    it("passCpM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          passCpM: 20,
        })
      )

      expect(result.current).toBeDefined()
    })

    it("endApproachAlertM을 커스텀으로 설정할 수 있다", () => {
      const context = createBaseContext()
      const { result } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
          endApproachAlertM: 100,
        })
      )

      expect(result.current).toBeDefined()
    })
  })

  describe("언마운트 시 정리", () => {
    it("언마운트 시 타이머가 정리된다", () => {
      const context = createBaseContext({
        status: "PAUSED_OFFCOURSE",
      })

      const { unmount } = renderHook(() =>
        useCourseProgress({
          context,
          controls: mockControls,
          onStart: mockOnStart,
          onForceStop: mockOnForceStop,
        })
      )

      // 언마운트
      unmount()

      // 10분 경과해도 onForceStop 호출 안됨
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000)
      })

      expect(mockOnForceStop).not.toHaveBeenCalled()
    })
  })
})
