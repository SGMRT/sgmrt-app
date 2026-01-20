/**
 * 기하/좌표 관련 유틸리티 함수
 */

import type { Telemetry } from "../../apis/types/run"
import type { Segment } from "../../components/map/RunningLine"
import { Coordinate, getDistance } from "../mapUtils"

/**
 * 텔레메트리 배열을 지도 세그먼트로 변환
 * @param telemetries 텔레메트리 배열
 * @param progress 현재 진행 위치 인덱스
 * @returns 달린 구간과 남은 구간으로 분리된 세그먼트 배열
 */
export function telemetriesToSegment(
  telemetries: Telemetry[],
  progress: number
): Segment[] {
  const run = telemetries.slice(
    0,
    progress >= telemetries.length ? telemetries.length : progress + 1
  )
  const rest = telemetries.slice(progress)

  return [
    {
      isRunning: true,
      points: run.map((telemetry) => ({
        longitude: telemetry.lng,
        latitude: telemetry.lat,
      })),
    },
    {
      isRunning: false,
      points: rest.map((telemetry) => ({
        longitude: telemetry.lng,
        latitude: telemetry.lat,
      })),
    },
  ]
}

/**
 * 두 좌표가 허용 거리 내에 있는지 확인
 * @param targetPosition 목표 좌표
 * @param currentPosition 현재 좌표
 * @param acceptanceDistance 허용 거리 (미터)
 * @returns 허용 거리 내에 있으면 true
 */
export function checkPointSynced(
  targetPosition: Coordinate,
  currentPosition: Coordinate,
  acceptanceDistance: number
): boolean {
  const distance = getDistance(targetPosition, currentPosition)
  return distance < acceptanceDistance
}

/**
 * 텔레메트리 배열에서 현재 위치와 가장 가까운 포인트의 인덱스 찾기
 * @param currentPosition 현재 좌표
 * @param telemetries 텔레메트리 배열
 * @param acceptanceDistance 허용 거리 (미터)
 * @returns 허용 거리 내의 첫 번째 포인트 인덱스, 없으면 -1
 */
export function findClosestPointIndex(
  currentPosition: Coordinate,
  telemetries: Telemetry[],
  acceptanceDistance: number
): number {
  return telemetries.findIndex((telemetry) =>
    checkPointSynced(
      { lat: telemetry.lat, lng: telemetry.lng },
      currentPosition,
      acceptanceDistance
    )
  )
}
