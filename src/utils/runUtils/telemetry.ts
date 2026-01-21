/**
 * 텔레메트리 관련 유틸리티 함수
 */

import type { Telemetry } from "../../apis/types/run"

/**
 * 마지막 isRunning=true 이후의 isRunning=false 포인트 제거
 * @param telemetries 텔레메트리 배열
 * @returns 마지막 러닝 포인트까지만 포함된 배열
 */
export function getTelemetriesWithoutLastFalse(
  telemetries: Telemetry[]
): Telemetry[] {
  const lastTrueIndex = telemetries.findLastIndex(
    (telemetry) => telemetry.isRunning
  )

  return telemetries.slice(0, lastTrueIndex + 1)
}
