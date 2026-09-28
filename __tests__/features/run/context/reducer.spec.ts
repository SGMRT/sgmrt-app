import {
  runReducer,
  routeKeyByStatus,
  initialRunContext,
} from "@/src/features/run/context/reducer"
import { RunAction } from "@/src/features/run/context/actions"
import { RunContext } from "@/src/features/run/context/context"
import { RawRunData } from "@/src/features/run/types"

// 테스트 헬퍼: RawRunData 생성
const createSample = (
  timestamp: number,
  lat = 37.5,
  lng = 127.0,
  distance = 0
): RawRunData => ({
  timestamp,
  latitude: lat,
  longitude: lng,
  altitude: 50,
  pressure: 1013,
  steps: {
    totalSteps: 100,
    deltaSteps: 2,
    last5sSteps: 10,
    timestamp,
  },
  distance,
  isRunning: true,
  bpm: 120,
  raw: {
    timestamp,
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    altitude: 50,
    altitudeAccuracy: 5,
    speed: 3,
    course: 90,
    pressure: 1013,
  },
})

describe("routeKeyByStatus", () => {
  it("RUNNING 상태는 mainTimeline으로 라우팅한다", () => {
    expect(routeKeyByStatus("RUNNING")).toBe("mainTimeline")
  })

  it("RUNNING_EXTENDED 상태는 mainTimeline으로 라우팅한다", () => {
    expect(routeKeyByStatus("RUNNING_EXTENDED")).toBe("mainTimeline")
  })

  it("PAUSED_USER 상태는 pausedBuffer로 라우팅한다", () => {
    expect(routeKeyByStatus("PAUSED_USER")).toBe("pausedBuffer")
  })

  it("READY 상태는 mutedBuffer로 라우팅한다", () => {
    expect(routeKeyByStatus("READY")).toBe("mutedBuffer")
  })

  it("PAUSED_OFFCOURSE 상태는 mutedBuffer로 라우팅한다", () => {
    expect(routeKeyByStatus("PAUSED_OFFCOURSE")).toBe("mutedBuffer")
  })

  it("COMPLETION_PENDING 상태는 postCompleteBuffer로 라우팅한다", () => {
    expect(routeKeyByStatus("COMPLETION_PENDING")).toBe("postCompleteBuffer")
  })

  it("IDLE 상태는 ignore로 라우팅한다", () => {
    expect(routeKeyByStatus("IDLE")).toBe("ignore")
  })

  it("STOPPED 상태는 ignore로 라우팅한다", () => {
    expect(routeKeyByStatus("STOPPED")).toBe("ignore")
  })
})

describe("runReducer", () => {
  describe("START 액션", () => {
    it("SOLO 모드로 시작하면 RUNNING 상태가 된다", () => {
      const action: RunAction = {
        type: "START",
        payload: {
          sessionId: "test-session",
          mode: "SOLO",
        },
      }

      const state = runReducer(undefined, action)

      expect(state.sessionId).toBe("test-session")
      expect(state.mode).toBe("SOLO")
      expect(state.status).toBe("RUNNING")
      expect(state.liveActivity.startedAtMs).not.toBeNull()
    })

    it("COURSE 모드로 시작하면 READY 상태가 된다", () => {
      const action: RunAction = {
        type: "START",
        payload: {
          sessionId: "test-session",
          mode: "COURSE",
          variant: "GHOST",
          courseMetadata: { distanceMeters: 5000 },
        },
      }

      const state = runReducer(undefined, action)

      expect(state.mode).toBe("COURSE")
      expect(state.status).toBe("READY")
      expect(state.variant).toBe("GHOST")
      expect(state.courseMetadata?.distanceMeters).toBe(5000)
      expect(state.liveActivity.startedAtMs).toBeNull() // COURSE는 시작 시간 null
    })

    it("userWeight를 설정할 수 있다", () => {
      const action: RunAction = {
        type: "START",
        payload: {
          sessionId: "test-session",
          mode: "SOLO",
          userWeight: 65,
        },
      }

      const state = runReducer(undefined, action)

      expect(state.userWeight).toBe(65)
    })

    it("userWeight가 없으면 기본값(70)을 사용한다", () => {
      const action: RunAction = {
        type: "START",
        payload: {
          sessionId: "test-session",
          mode: "SOLO",
        },
      }

      const state = runReducer(undefined, action)

      expect(state.userWeight).toBe(70)
    })

    it("버퍼와 통계를 초기화한다", () => {
      const action: RunAction = {
        type: "START",
        payload: {
          sessionId: "test-session",
          mode: "SOLO",
        },
      }

      const state = runReducer(undefined, action)

      expect(state.mainTimeline).toEqual([])
      expect(state.pausedBuffer).toEqual([])
      expect(state.mutedBuffer).toEqual([])
      expect(state.postCompleteBuffer).toEqual([])
      expect(state.telemetries).toEqual([])
      expect(state.segments).toEqual([])
    })
  })

  describe("READY 액션", () => {
    it("READY 상태로 전환한다", () => {
      const initialState = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })

      const state = runReducer(initialState, { type: "READY" })

      expect(state.status).toBe("READY")
    })
  })

  describe("PAUSE_USER 액션", () => {
    it("PAUSED_USER 상태로 전환한다", () => {
      const initialState = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      const state = runReducer(initialState, { type: "PAUSE_USER" })

      expect(state.status).toBe("PAUSED_USER")
      expect(state.liveActivity.pausedAtMs).not.toBeNull()
    })
  })

  describe("OFFCOURSE 액션", () => {
    it("PAUSED_OFFCOURSE 상태로 전환한다", () => {
      const initialState = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })

      const state = runReducer(initialState, { type: "OFFCOURSE" })

      expect(state.status).toBe("PAUSED_OFFCOURSE")
    })
  })

  describe("COMPLETE 액션", () => {
    it("COMPLETION_PENDING 상태로 전환한다", () => {
      const initialState = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })

      const state = runReducer(initialState, { type: "COMPLETE" })

      expect(state.status).toBe("COMPLETION_PENDING")
    })
  })

  describe("RESUME 액션", () => {
    it("RUNNING 상태로 전환한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      state = runReducer(state, { type: "RESUME" })

      expect(state.status).toBe("RUNNING")
      expect(state.liveActivity.pausedAtMs).toBeNull()
    })

    it("pausedBuffer를 mainTimeline에 병합한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      const pausedCount = state.pausedBuffer.length
      state = runReducer(state, { type: "RESUME" })

      expect(state.pausedBuffer).toEqual([])
      expect(state.mainTimeline.length).toBe(pausedCount)
    })

    it("_zeroNextDt를 true로 설정한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      state = runReducer(state, { type: "RESUME" })

      expect(state._zeroNextDt).toBe(true)
    })
  })

  describe("ONCOURSE 액션", () => {
    it("RUNNING 상태로 전환한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "OFFCOURSE" })

      state = runReducer(state, { type: "ONCOURSE" })

      expect(state.status).toBe("RUNNING")
    })

    it("mutedBuffer를 비운다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "OFFCOURSE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      state = runReducer(state, { type: "ONCOURSE" })

      expect(state.mutedBuffer).toEqual([])
    })
  })

  describe("STOP 액션", () => {
    it("STOPPED 상태로 전환한다", () => {
      const initialState = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      const state = runReducer(initialState, { type: "STOP" })

      expect(state.status).toBe("STOPPED")
    })
  })

  describe("RESET 액션", () => {
    it("초기 상태로 리셋한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      state = runReducer(state, { type: "RESET" })

      expect(state).toEqual(initialRunContext)
    })
  })

  describe("ACCEPT_SAMPLE 액션", () => {
    it("RUNNING 상태에서 mainTimeline에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.mainTimeline).toHaveLength(1)
      expect(state.telemetries).toHaveLength(1)
    })

    it("PAUSED_USER 상태에서 pausedBuffer에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.pausedBuffer).toHaveLength(1)
      expect(state.mainTimeline).toHaveLength(0)
    })

    it("READY 상태에서 mutedBuffer에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.mutedBuffer).toHaveLength(1)
    })

    it("COMPLETION_PENDING 상태에서 postCompleteBuffer에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.postCompleteBuffer).toHaveLength(1)
    })

    it("IDLE 상태에서는 샘플을 무시한다", () => {
      const state = runReducer(initialRunContext, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.mainTimeline).toHaveLength(0)
      expect(state.pausedBuffer).toHaveLength(0)
      expect(state.mutedBuffer).toHaveLength(0)
    })

    it("STOPPED 상태에서는 샘플을 무시한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "STOP" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.mainTimeline).toHaveLength(0)
    })

    it("stats를 업데이트한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000, 37.5, 127.0, 100) },
      })

      expect(state.stats.totalDistanceM).toBeGreaterThanOrEqual(0)
    })
  })

  describe("SET_LIVE_ACTIVITY_MESSAGE 액션", () => {
    it("liveActivity 메시지를 설정한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      state = runReducer(state, {
        type: "SET_LIVE_ACTIVITY_MESSAGE",
        payload: { message: "테스트 메시지", messageType: "ALERT" },
      })

      expect(state.liveActivity.message).toBe("테스트 메시지")
      expect(state.liveActivity.messageType).toBe("ALERT")
    })

    it("메시지를 null로 설정할 수 있다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, {
        type: "SET_LIVE_ACTIVITY_MESSAGE",
        payload: { message: "테스트", messageType: "ALERT" },
      })

      state = runReducer(state, {
        type: "SET_LIVE_ACTIVITY_MESSAGE",
        payload: { message: null, messageType: null },
      })

      expect(state.liveActivity.message).toBeNull()
      expect(state.liveActivity.messageType).toBeNull()
    })
  })

  describe("불변성", () => {
    it("상태 변경 시 새 객체를 반환한다", () => {
      const state1 = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      const state2 = runReducer(state1, { type: "PAUSE_USER" })

      expect(state1).not.toBe(state2)
      expect(state1.status).toBe("RUNNING")
      expect(state2.status).toBe("PAUSED_USER")
    })

    it("배열 변경 시 새 배열을 생성한다", () => {
      const state1 = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      const state2 = runReducer(state1, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state1.mainTimeline).not.toBe(state2.mainTimeline)
      expect(state1.telemetries).not.toBe(state2.telemetries)
    })
  })

  describe("알 수 없는 액션", () => {
    it("알 수 없는 액션은 현재 상태를 반환한다", () => {
      const state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      const nextState = runReducer(state, { type: "UNKNOWN" } as any)

      expect(nextState).toBe(state)
    })
  })

  describe("EXTEND 액션", () => {
    it("RUNNING_EXTENDED 상태로 전환한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })

      state = runReducer(state, { type: "EXTEND" })

      expect(state.status).toBe("RUNNING_EXTENDED")
    })

    it("postCompleteBuffer를 mainTimeline에 병합한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(2000, 37.501, 127.001, 100) },
      })

      const postBufferCount = state.postCompleteBuffer.length
      state = runReducer(state, { type: "EXTEND" })

      expect(state.postCompleteBuffer).toEqual([])
      expect(state.mainTimeline.length).toBe(postBufferCount)
    })

    it("postCompleteBuffer 샘플들을 telemetries에 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      const telemetryCountBefore = state.telemetries.length
      state = runReducer(state, { type: "EXTEND" })

      expect(state.telemetries.length).toBeGreaterThan(telemetryCountBefore)
    })

    it("완주 대기(COMPLETION_PENDING) 시간과 거리를 stats에 합산하지 않는다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "ONCOURSE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(3000, 37.5001, 127.0, 10) },
      })
      const statsBefore = state.stats

      // 완주 화면에서 90초 대기 (샘플은 계속 수신됨)
      state = runReducer(state, { type: "COMPLETE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(33000, 37.5002, 127.0, 20) },
      })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(93000, 37.5003, 127.0, 20) },
      })

      state = runReducer(state, { type: "EXTEND" })

      // 대기 시간(90초)과 대기 중 이동 거리는 기록에 포함되지 않아야 함
      // (화면 타이머도 이 구간을 제외하므로 일관성 유지)
      expect(state.stats.totalTimeMs).toBe(statsBefore.totalTimeMs)
      expect(state.stats.totalDistanceM).toBe(statsBefore.totalDistanceM)
    })

    it("완주 대기 샘플의 텔레메트리는 isRunning=false로 기록한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "ONCOURSE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })
      state = runReducer(state, { type: "COMPLETE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(5000) },
      })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(8000) },
      })

      const telemetryCountBefore = state.telemetries.length
      state = runReducer(state, { type: "EXTEND" })

      const appended = state.telemetries.slice(telemetryCountBefore)
      expect(appended.length).toBe(2)
      expect(appended.every((t) => t.isRunning === false)).toBe(true)
    })

    it("pausedAtMs를 null로 설정한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })

      state = runReducer(state, { type: "EXTEND" })

      expect(state.liveActivity.pausedAtMs).toBeNull()
    })

    it("_zeroNextDt를 true로 설정한다 (재개 첫 샘플 dt 0 처리, RESUME과 동일)", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })

      state = runReducer(state, { type: "EXTEND" })

      expect(state._zeroNextDt).toBe(true)
    })
  })

  describe("PAUSE_USER/OFFCOURSE/COMPLETE pausedAtMs 유지", () => {
    it("이미 pausedAtMs가 있으면 유지한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      const firstPausedAt = state.liveActivity.pausedAtMs

      // 다시 PAUSE_USER (이미 일시정지 상태에서)
      state = runReducer(state, { type: "OFFCOURSE" })

      expect(state.liveActivity.pausedAtMs).toBe(firstPausedAt)
    })
  })

  describe("RESUME/ONCOURSE startedAtMs 조정", () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it("일시정지 시간만큼 startedAtMs를 조정한다", () => {
      jest.setSystemTime(new Date("2024-01-15T10:00:00.000Z"))

      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      const originalStartedAt = state.liveActivity.startedAtMs!

      jest.setSystemTime(new Date("2024-01-15T10:05:00.000Z"))
      state = runReducer(state, { type: "PAUSE_USER" })

      jest.setSystemTime(new Date("2024-01-15T10:10:00.000Z"))
      state = runReducer(state, { type: "RESUME" })

      // 5분 일시정지 했으므로 startedAtMs가 5분 뒤로 조정됨
      expect(state.liveActivity.startedAtMs).toBe(
        originalStartedAt + 5 * 60 * 1000
      )
    })
  })

  describe("PAUSED_OFFCOURSE 상태에서 샘플 처리", () => {
    it("PAUSED_OFFCOURSE 상태에서 mutedBuffer에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "OFFCOURSE" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.mutedBuffer).toHaveLength(1)
      expect(state.mainTimeline).toHaveLength(0)
    })
  })

  describe("RUNNING_EXTENDED 상태에서 샘플 처리", () => {
    it("RUNNING_EXTENDED 상태에서 mainTimeline에 샘플을 추가한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "COURSE" },
      })
      state = runReducer(state, { type: "COMPLETE" })
      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })
      state = runReducer(state, { type: "EXTEND" })

      const mainTimelineCount = state.mainTimeline.length

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(2000, 37.502, 127.002, 200) },
      })

      expect(state.mainTimeline.length).toBe(mainTimelineCount + 1)
    })
  })

  describe("segments 업데이트", () => {
    it("RUNNING 상태에서 세그먼트가 추가된다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.segments.length).toBeGreaterThan(0)
    })

    it("PAUSED_USER 상태에서 세그먼트가 추가된다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.segments.length).toBeGreaterThan(0)
    })
  })

  describe("telemetry 생성", () => {
    it("PAUSED_USER 상태에서 isRunning=false인 telemetry를 생성한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })
      state = runReducer(state, { type: "PAUSE_USER" })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.telemetries[0].isRunning).toBe(false)
    })

    it("RUNNING 상태에서 isRunning=true인 telemetry를 생성한다", () => {
      let state = runReducer(undefined, {
        type: "START",
        payload: { sessionId: "test", mode: "SOLO" },
      })

      state = runReducer(state, {
        type: "ACCEPT_SAMPLE",
        payload: { sample: createSample(1000) },
      })

      expect(state.telemetries[0].isRunning).toBe(true)
    })
  })
})
