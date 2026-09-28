/**
 * 합성 GPS 트레이스 리플레이 하네스
 *
 * 수학적으로 정답(실제 이동 거리/페이스/케이던스)을 아는 가짜 GPS 트레이스를
 * 생성하고, 실제 측정 파이프라인(location.task → joinedState → reducer)에
 * 재생하여 측정 정확도를 CI에서 검증한다.
 *
 * 노이즈 모델: iOS BestForNavigation 출력은 이미 스무딩되어 있어
 * 샘플 간 노이즈가 독립적이지 않고 천천히 표류(random walk)한다.
 * 이를 AR(1) 상관 노이즈로 모델링한다.
 */
import { runReducer } from "@/src/features/run/context/reducer"
import type { RunContext } from "@/src/features/run/context/context"
import type { RunningStats } from "@/src/features/run/context/stats"
import { joinedState } from "@/src/features/run/store/joinedState"
import { sharedSensorStore } from "@/src/features/run/store/sensorStore"
import type { RawRunData } from "@/src/features/run/types"

// ---------- 시드 기반 난수 (테스트 결정성 보장) ----------

export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gaussianFactory(rng: () => number): () => number {
  let spare: number | null = null
  return () => {
    if (spare != null) {
      const value = spare
      spare = null
      return value
    }
    let u = 0
    while (u === 0) u = rng()
    const v = rng()
    const mag = Math.sqrt(-2 * Math.log(u))
    spare = mag * Math.sin(2 * Math.PI * v)
    return mag * Math.cos(2 * Math.PI * v)
  }
}

/** AR(1) 상관 노이즈: value_t = rho * value_{t-1} + sigma * sqrt(1-rho^2) * N(0,1) */
class CorrelatedNoise {
  private value = 0

  constructor(
    private readonly gaussian: () => number,
    private readonly sigmaM: number,
    private readonly rho: number
  ) {}

  next(): number {
    this.value =
      this.rho * this.value +
      this.sigmaM * Math.sqrt(1 - this.rho * this.rho) * this.gaussian()
    return this.value
  }
}

// ---------- 트레이스 세그먼트 정의 ----------

export type TraceSegment =
  | {
      type: "run"
      durationSec: number
      speedMps: number
      /** 분당 스텝 수 (기본 170) */
      cadenceSpm?: number
      /** 지정 시 해당 반지름의 원호를 따라 이동 (곡선 왜곡 검증용) */
      turnRadiusM?: number
    }
  | { type: "stop"; durationSec: number }
  /** GPS 신호 유실: 위치는 계속 이동하지만 샘플은 방출되지 않음 (터널) */
  | { type: "gap"; durationSec: number; speedMps: number; cadenceSpm?: number }

export interface SyntheticLocation {
  timestamp: number
  coords: {
    latitude: number
    longitude: number
    accuracy: number
    altitude: number
    altitudeAccuracy: number
    speed: number
    heading: number
  }
}

export interface SyntheticTrace {
  locations: SyntheticLocation[]
  stepSamples: { totalSteps: number; timestamp: number }[]
  /** getStepCountAsync 목 구현용: 임의 시간창의 스텝 수 */
  stepsBetween(startMs: number, endMs: number): number
  /** 실제 이동 거리 (run + gap 구간, stop 제외) */
  trueDistanceM: number
  trueDurationMs: number
}

export interface TraceOptions {
  seed?: number
  /** 샘플링 주기 (Hz, 기본 1 — iOS BestForNavigation 실측 기준) */
  hz?: number
  /** 위치 노이즈 표준편차 (m, 기본 2) */
  noiseSigmaM?: number
  /** 노이즈 시간 상관 계수 (기본 0.95) */
  noiseRho?: number
  accuracyM?: number
}

const ORIGIN_LAT = 37.5
const ORIGIN_LNG = 127.0
const M_PER_DEG_LAT = 111_320
const START_TS = 1_700_000_000_000
const DEFAULT_CADENCE = 170

export function generateTrace(
  segments: TraceSegment[],
  options: TraceOptions = {}
): SyntheticTrace {
  const {
    seed = 42,
    hz = 1,
    noiseSigmaM = 2,
    noiseRho = 0.95,
    accuracyM = 5,
  } = options

  const gaussian = gaussianFactory(mulberry32(seed))
  const noiseX = new CorrelatedNoise(gaussian, noiseSigmaM, noiseRho)
  const noiseY = new CorrelatedNoise(gaussian, noiseSigmaM, noiseRho)

  const dtSec = 1 / hz
  const cosLat = Math.cos((ORIGIN_LAT * Math.PI) / 180)

  // 실제(true) 상태
  let xM = 0
  let yM = 0
  let headingRad = 0
  let tMs = START_TS
  let totalSteps = 0
  let trueDistanceM = 0

  const locations: SyntheticLocation[] = []
  const stepTimeline: { tMs: number; totalSteps: number }[] = [
    { tMs, totalSteps },
  ]
  const stepSamples: { totalSteps: number; timestamp: number }[] = []

  for (const segment of segments) {
    const ticks = Math.round(segment.durationSec * hz)

    for (let i = 0; i < ticks; i++) {
      const speed = segment.type === "stop" ? 0 : segment.speedMps
      const cadence =
        segment.type === "stop"
          ? 0
          : segment.cadenceSpm ?? DEFAULT_CADENCE

      // 실제 위치 전진
      if (speed > 0) {
        if (segment.type === "run" && segment.turnRadiusM) {
          headingRad += (speed * dtSec) / segment.turnRadiusM
        }
        xM += speed * dtSec * Math.sin(headingRad)
        yM += speed * dtSec * Math.cos(headingRad)
        trueDistanceM += speed * dtSec
      }

      totalSteps += (cadence / 60) * dtSec
      tMs += dtSec * 1000

      stepTimeline.push({ tMs, totalSteps })
      stepSamples.push({ totalSteps: Math.floor(totalSteps), timestamp: tMs })

      // gap 구간은 GPS 샘플을 방출하지 않음 (스텝은 계속 기록됨)
      if (segment.type === "gap") continue

      const noisyX = xM + noiseX.next()
      const noisyY = yM + noiseY.next()

      locations.push({
        timestamp: tMs,
        coords: {
          latitude: ORIGIN_LAT + noisyY / M_PER_DEG_LAT,
          longitude: ORIGIN_LNG + noisyX / (M_PER_DEG_LAT * cosLat),
          accuracy: accuracyM,
          altitude: 50,
          altitudeAccuracy: 5,
          speed,
          heading: ((headingRad * 180) / Math.PI + 360) % 360,
        },
      })
    }
  }

  const interpolateSteps = (queryMs: number): number => {
    if (queryMs <= stepTimeline[0].tMs) return 0
    const lastEntry = stepTimeline[stepTimeline.length - 1]
    if (queryMs >= lastEntry.tMs) return lastEntry.totalSteps
    for (let i = 1; i < stepTimeline.length; i++) {
      if (stepTimeline[i].tMs >= queryMs) {
        const prev = stepTimeline[i - 1]
        const curr = stepTimeline[i]
        const ratio = (queryMs - prev.tMs) / (curr.tMs - prev.tMs)
        return prev.totalSteps + ratio * (curr.totalSteps - prev.totalSteps)
      }
    }
    return lastEntry.totalSteps
  }

  return {
    locations,
    stepSamples,
    stepsBetween: (startMs, endMs) =>
      Math.max(
        0,
        Math.round(interpolateSteps(endMs) - interpolateSteps(startMs))
      ),
    trueDistanceM,
    trueDurationMs: tMs - START_TS,
  }
}

// ---------- 리플레이 러너 ----------

type TaskCallback = (body: { data: unknown; error: unknown }) => Promise<void>

/**
 * 트레이스를 실제 location.task 콜백에 재생하고
 * joinedState로 방출된 샘플들을 수집한다.
 *
 * 호출 전 sharedSensorStore.reset() + joinedState.reset()이 되어 있어야
 * 태스크가 첫 샘플에서 필터 싱글톤들을 초기화한다.
 */
export async function replayThroughTask(
  taskCallback: TaskCallback,
  trace: SyntheticTrace
): Promise<RawRunData[]> {
  const samples: RawRunData[] = []
  const unsubscribe = joinedState.subscribe((s) => samples.push(s))

  let stepIndex = 0
  try {
    for (const location of trace.locations) {
      // 위치 시각까지의 스텝 샘플을 먼저 스토어에 반영
      while (
        stepIndex < trace.stepSamples.length &&
        trace.stepSamples[stepIndex].timestamp <= location.timestamp
      ) {
        const step = trace.stepSamples[stepIndex]
        sharedSensorStore.pushSteps({
          steps: step.totalSteps,
          timestamp: step.timestamp,
        })
        stepIndex++
      }

      await taskCallback({ data: { locations: [location] }, error: null })
    }
  } finally {
    unsubscribe()
  }

  return samples
}

/** 수집된 샘플을 리듀서에 통과시켜 최종 컨텍스트와 stats 시계열을 얻는다 */
export function runThroughReducer(samples: RawRunData[]): {
  ctx: RunContext
  statsSeries: RunningStats[]
} {
  let ctx = runReducer(undefined, {
    type: "START",
    payload: { sessionId: "synthetic-replay", mode: "SOLO" },
  })

  const statsSeries: RunningStats[] = []
  for (const sample of samples) {
    ctx = runReducer(ctx, { type: "ACCEPT_SAMPLE", payload: { sample } })
    statsSeries.push(ctx.stats)
  }

  return { ctx, statsSeries }
}
