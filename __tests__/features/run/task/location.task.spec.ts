/**
 * location.task 백그라운드 태스크 직렬화 테스트
 *
 * expo-task-manager는 async 핸들러를 직렬화하지 않으므로,
 * 태스크 내부에서 자체적으로 인보케이션을 직렬화해야
 * 공유 필터/스토어 상태가 오염되지 않는다.
 */
import { getStepCountAsync } from "expo-sensors/build/Pedometer"
import * as TaskManager from "expo-task-manager"

jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
}))

jest.mock("expo-sensors", () => ({
  Barometer: {},
}))

jest.mock("expo-sensors/build/Pedometer", () => ({
  getStepCountAsync: jest.fn(),
}))

jest.mock("@/src/utils/devLog", () => ({
  devLog: jest.fn(),
}))

jest.mock("@/src/utils/sentryTools", () => ({
  captureError: jest.fn(),
  ERROR_PRIORITY: { HIGH: "high", MEDIUM: "medium", LOW: "low" },
}))

import { joinedState } from "@/src/features/run/store/joinedState"
import { sharedSensorStore } from "@/src/features/run/store/sensorStore"

// 태스크 등록 (side effect)
import "@/src/features/run/task/location.task"

const LAT_PER_M = 1 / 111320

const makeLocation = (timestamp: number, northM: number) => ({
  timestamp,
  coords: {
    latitude: 37.5 + northM * LAT_PER_M,
    longitude: 127.0,
    accuracy: 5,
    altitude: 50,
    altitudeAccuracy: 5,
    speed: 3,
    heading: 0,
  },
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe("location.task", () => {
  const taskCallback = (TaskManager.defineTask as jest.Mock).mock
    .calls[0][1] as (body: {
    data: unknown
    error: unknown
  }) => Promise<void>

  let pushSpy: jest.SpyInstance

  beforeEach(() => {
    sharedSensorStore.reset()
    joinedState.reset()
    pushSpy = jest.spyOn(joinedState, "push")
    ;(getStepCountAsync as jest.Mock).mockReset()
    ;(getStepCountAsync as jest.Mock).mockResolvedValue({ steps: 10 })
  })

  afterEach(() => {
    pushSpy.mockRestore()
  })

  it("태스크를 defineTask로 등록한다", () => {
    expect(TaskManager.defineTask).toHaveBeenCalledTimes(1)
  })

  it("동시 인보케이션을 직렬화하여 샘플 순서를 보장한다", async () => {
    // 첫 인보케이션은 getStepCountAsync에서 지연됨
    const stepsDeferred = deferred<{ steps: number }>()
    ;(getStepCountAsync as jest.Mock)
      .mockImplementationOnce(() => stepsDeferred.promise)
      .mockResolvedValue({ steps: 10 })

    const first = taskCallback({
      data: { locations: [makeLocation(1000, 0)] },
      error: null,
    })
    // 첫 번째가 await에 걸려있는 동안 두 번째 배치 도착
    const second = taskCallback({
      data: { locations: [makeLocation(2000, 3)] },
      error: null,
    })

    await flush()
    stepsDeferred.resolve({ steps: 10 })
    await Promise.all([first, second])

    const pushedTimestamps = pushSpy.mock.calls.map(
      ([sample]) => sample.timestamp
    )
    expect(pushedTimestamps).toEqual([1000, 2000])
  })

  it("에러 인보케이션 이후에도 다음 배치를 정상 처리한다", async () => {
    await taskCallback({ data: null, error: { message: "boom" } })
    await taskCallback({
      data: { locations: [makeLocation(1000, 0)] },
      error: null,
    })

    expect(pushSpy).toHaveBeenCalledTimes(1)
  })
})
