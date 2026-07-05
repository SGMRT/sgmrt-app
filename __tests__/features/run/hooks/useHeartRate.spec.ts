import { renderHook, waitFor } from "@testing-library/react-native"
import { useHeartRate } from "@/src/features/run/hooks/useHeartRate"
import * as watch from "@/modules/expo-watch-module"
import { captureError } from "@/src/utils/sentryTools"
import type { RunContext } from "@/src/features/run/context/context"
import type { RunStatus } from "@/src/features/run/types"

jest.mock("@/modules/expo-watch-module", () => ({
  nowIso: () => "2026-01-01T00:00:00.000Z",
  start: jest.fn(() => Promise.resolve()),
  startWorkout: jest.fn(() => Promise.resolve()),
  resume: jest.fn(() => Promise.resolve()),
  pause: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
}))

jest.mock("@/src/utils/sentryTools", () => ({
  captureError: jest.fn(),
  ERROR_PRIORITY: { HIGH: "high", MEDIUM: "medium", LOW: "low" },
}))

const ctx = (status: RunStatus) => ({ status }) as RunContext

type Props = { c: RunContext }
const render = (c: RunContext) =>
  renderHook(({ c }: Props) => useHeartRate(c), { initialProps: { c } })

const expectCaptured = (op: string) =>
  expect(captureError).toHaveBeenCalledWith(
    `watch.${op}`,
    expect.any(Error),
    expect.anything(),
    expect.objectContaining({ where: "watch" }),
    expect.anything()
  )

describe("useHeartRate", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(watch.start as jest.Mock).mockResolvedValue(undefined)
    ;(watch.startWorkout as jest.Mock).mockResolvedValue(undefined)
    ;(watch.resume as jest.Mock).mockResolvedValue(undefined)
    ;(watch.pause as jest.Mock).mockResolvedValue(undefined)
    ;(watch.stop as jest.Mock).mockResolvedValue(undefined)
  })

  it("IDLE→RUNNING 전환 시 start와 startWorkout을 호출한다", async () => {
    const { rerender } = render(ctx("IDLE"))
    rerender({ c: ctx("RUNNING") })

    await waitFor(() => expect(watch.startWorkout).toHaveBeenCalled())
    expect(watch.start).toHaveBeenCalled()
  })

  it("resume 실패를 unhandled rejection 없이 captureError로 포집한다", async () => {
    ;(watch.resume as jest.Mock).mockRejectedValueOnce(new Error("Resume failed"))
    const { rerender } = render(ctx("PAUSED_USER"))
    rerender({ c: ctx("RUNNING") })

    await waitFor(() => expectCaptured("resume"))
  })

  it("pause 실패를 captureError로 포집한다", async () => {
    ;(watch.pause as jest.Mock).mockRejectedValueOnce(new Error("Pause failed"))
    const { rerender } = render(ctx("RUNNING"))
    rerender({ c: ctx("PAUSED_USER") })

    await waitFor(() => expectCaptured("pause"))
  })

  it("stop 실패를 비동기로 포집한다 (동기 try/catch는 Promise reject를 못 잡음, REACT-NATIVE-53)", async () => {
    ;(watch.stop as jest.Mock).mockRejectedValueOnce(new Error("Stop failed"))
    const { rerender } = render(ctx("RUNNING"))
    rerender({ c: ctx("STOPPED") })

    await waitFor(() => expectCaptured("stop"))
  })

  it("start 실패 후에는 이후 상태 전환에서 워치 호출을 시도하지 않는다", async () => {
    ;(watch.start as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to start watch app")
    )
    const { rerender } = render(ctx("IDLE"))
    rerender({ c: ctx("RUNNING") })

    await waitFor(() => expectCaptured("start"))
    ;(watch.pause as jest.Mock).mockClear()

    rerender({ c: ctx("PAUSED_USER") })
    expect(watch.pause).not.toHaveBeenCalled()
  })
})
