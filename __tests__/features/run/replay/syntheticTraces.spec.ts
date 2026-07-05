/**
 * 합성 트레이스 측정 정확도 검증
 *
 * 정답을 아는 합성 GPS 트레이스를 실제 파이프라인
 * (location.task → 필터 체인 → joinedState → reducer/stats)에 재생하여
 * 거리/페이스/케이던스 측정 정확도를 검증한다.
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

import {
  generateTrace,
  replayThroughTask,
  runThroughReducer,
  SyntheticTrace,
} from "./harness"

const taskCallback = (TaskManager.defineTask as jest.Mock).mock
  .calls[0][1] as (body: { data: unknown; error: unknown }) => Promise<void>

/** 5:00/km 페이스 = 3.333 m/s */
const PACE_5_00 = 1000 / 300
/** 3:30/km 페이스 = 4.762 m/s */
const PACE_3_30 = 1000 / 210

async function replay(trace: SyntheticTrace) {
  ;(getStepCountAsync as jest.Mock).mockImplementation(
    (start: Date, end: Date) =>
      Promise.resolve({
        steps: trace.stepsBetween(start.getTime(), end.getTime()),
      })
  )

  const samples = await replayThroughTask(taskCallback, trace)
  return runThroughReducer(samples)
}

describe("합성 트레이스 측정 정확도", () => {
  beforeEach(() => {
    sharedSensorStore.reset()
    joinedState.reset()
    ;(getStepCountAsync as jest.Mock).mockReset()
  })

  it("직선 1km 정속(5:00/km): 거리 ±2%, 평균 페이스 ±10초/km", async () => {
    const trace = generateTrace([
      { type: "run", durationSec: 300, speedMps: PACE_5_00 },
    ])
    expect(trace.trueDistanceM).toBeCloseTo(1000, 0)

    const { ctx } = await replay(trace)


    expect(ctx.stats.totalDistanceM).toBeGreaterThan(980)
    expect(ctx.stats.totalDistanceM).toBeLessThan(1020)
    expect(ctx.stats.avgPaceSecPerKm).toBeGreaterThan(290)
    expect(ctx.stats.avgPaceSecPerKm).toBeLessThan(310)
  })

  it("원형 트랙 400m x 2.5바퀴(곡선 왜곡): 거리 ±3%", async () => {
    // 반지름 63.66m 원의 둘레 = 400m
    const trace = generateTrace([
      {
        type: "run",
        durationSec: 300,
        speedMps: PACE_5_00,
        turnRadiusM: 400 / (2 * Math.PI),
      },
    ])
    expect(trace.trueDistanceM).toBeCloseTo(1000, 0)

    const { ctx } = await replay(trace)


    expect(ctx.stats.totalDistanceM).toBeGreaterThan(970)
    expect(ctx.stats.totalDistanceM).toBeLessThan(1030)
  })

  it("신호등 정지: 정지 60초 동안 유령 거리 5m 미만", async () => {
    const trace = generateTrace([
      { type: "run", durationSec: 120, speedMps: PACE_5_00 },
      { type: "stop", durationSec: 60 },
      { type: "run", durationSec: 120, speedMps: PACE_5_00 },
    ])

    const { ctx, statsSeries } = await replay(trace)

    // 정지 구간(120s~180s)의 거리 증가량
    const stopStartIdx = 119
    const stopEndIdx = 179
    const distBeforeStop = statsSeries[stopStartIdx].totalDistanceM
    const distAfterStop = statsSeries[stopEndIdx].totalDistanceM
    const phantomDist = distAfterStop - distBeforeStop


    expect(phantomDist).toBeLessThan(5)
    // 총거리는 실제 이동 거리(800m) 대비 ±3%
    expect(ctx.stats.totalDistanceM).toBeGreaterThan(776)
    expect(ctx.stats.totalDistanceM).toBeLessThan(824)
  })

  it("터널(30초 신호 유실): 거리 측정이 정지하지 않고 회복한다", async () => {
    const trace = generateTrace([
      { type: "run", durationSec: 60, speedMps: PACE_5_00 },
      { type: "gap", durationSec: 30, speedMps: PACE_5_00 },
      { type: "run", durationSec: 60, speedMps: PACE_5_00 },
    ])
    // true = 150초 x 3.333 = 500m

    const { ctx, statsSeries } = await replay(trace)

    // 갭 이후 거리가 계속 누적되는지 (데드엔드 회귀 방지)
    const distAtGapEnd = statsSeries[60].totalDistanceM
    const distFinal = ctx.stats.totalDistanceM
    const postGapGain = distFinal - distAtGapEnd


    // 갭 이후 60초 x 3.333 = 200m가 계속 누적되어야 함
    expect(postGapGain).toBeGreaterThan(180)
    // 총거리: 갭 구간 직선 보간 포함 500m에 근접해야 함
    expect(distFinal).toBeGreaterThan(450)
    expect(distFinal).toBeLessThan(520)
  })

  it("인터벌(5:00/km -> 3:30/km): 페이스가 15초 내 새 페이스에 수렴", async () => {
    const trace = generateTrace([
      { type: "run", durationSec: 90, speedMps: PACE_5_00 },
      { type: "run", durationSec: 90, speedMps: PACE_3_30, cadenceSpm: 190 },
    ])

    const { statsSeries } = await replay(trace)

    // 전환(90s) 후 15초 시점의 현재 페이스
    const paceAt15sAfterSwitch = statsSeries[104].currentPaceSecPerKm

    expect(paceAt15sAfterSwitch).not.toBeNull()
    expect(paceAt15sAfterSwitch!).toBeGreaterThan(195)
    expect(paceAt15sAfterSwitch!).toBeLessThan(225)
    // 물리적으로 불가능한 페이스(90초/km 미만)는 어느 시점에도 없어야 함
    const impossiblePaces = statsSeries.filter(
      (s) => s.currentPaceSecPerKm != null && s.currentPaceSecPerKm < 90
    )
    expect(impossiblePaces).toHaveLength(0)
  })

  it("케이던스 180spm: 현재/평균 케이던스 ±5spm", async () => {
    const trace = generateTrace([
      { type: "run", durationSec: 180, speedMps: PACE_5_00, cadenceSpm: 180 },
    ])

    const { ctx } = await replay(trace)


    expect(ctx.stats.currentCadenceSpm).toBeGreaterThan(175)
    expect(ctx.stats.currentCadenceSpm).toBeLessThan(185)
    expect(ctx.stats.avgCadenceSpm).toBeGreaterThan(175)
    expect(ctx.stats.avgCadenceSpm).toBeLessThan(185)
  })
})
