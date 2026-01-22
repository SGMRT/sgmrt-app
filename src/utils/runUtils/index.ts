/**
 * 러닝 유틸리티 함수 모음
 *
 * 하위 모듈:
 * - time: 시간 관련 함수 (getRunTime, getDate, getRunName)
 * - pace: 페이스 관련 함수 (getPace, getFormattedPace)
 * - calories: 칼로리/케이던스 함수 (getCalories, getCadence)
 * - geometry: 좌표/세그먼트 함수 (telemetriesToSegment, checkPointSynced, findClosestPointIndex)
 * - telemetry: 텔레메트리 함수 (getTelemetriesWithoutLastFalse)
 * - saveRunning: 러닝 저장 함수
 */

// 시간 관련
export { getDate, getRunName, getRunTime } from "./time"

// 페이스 관련
export { getFormattedPace, getPace } from "./pace"

// 칼로리/케이던스 관련
export { getCadence, getCalories } from "./calories"

// 기하/좌표 관련
export {
  checkPointSynced,
  findClosestPointIndex,
  telemetriesToSegment,
} from "./geometry"

// 텔레메트리 관련
export { getTelemetriesWithoutLastFalse } from "./telemetry"

// 러닝 저장
export { saveRunning, SaveRunningError } from "./saveRunning"
export type { SaveRunningProps, SaveRunningResult } from "./saveRunning"
