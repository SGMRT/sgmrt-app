/**
 * 칼로리/케이던스 관련 유틸리티 함수
 */

interface CaloriesParams {
  distance: number // 미터
  timeInSec: number // 초
  weight: number // kg
}

/**
 * MET (Metabolic Equivalent of Task) 기반 칼로리 계산
 * @param params.distance 거리 (미터)
 * @param params.timeInSec 시간 (초)
 * @param params.weight 체중 (kg)
 * @returns 소모 칼로리 (kcal)
 */
export function getCalories({
  distance,
  timeInSec,
  weight,
}: CaloriesParams): number {
  if (timeInSec === 0 || distance === 0 || weight === 0) return 0

  const timeInHours = timeInSec / 3600
  const distanceKm = distance / 1000
  const speed = distanceKm / timeInHours

  // MET 값은 속도에 따라 다름
  let met = 1

  if (speed < 6.4) met = 4.5
  else if (speed < 8) met = 7
  else if (speed < 9.7) met = 9.0
  else if (speed < 11.3) met = 11.0
  else met = 13.5

  return Math.round(met * weight * timeInHours)
}

/**
 * 걸음수와 시간으로 케이던스 계산 (걸음/분)
 * @param stepCount 걸음수
 * @param timeInSec 시간 (초)
 * @returns 케이던스 (걸음/분), 유효하지 않으면 0
 */
export function getCadence(stepCount: number, timeInSec: number): number {
  if (timeInSec === 0 || stepCount === 0) return 0
  return Math.round((stepCount / timeInSec) * 60)
}
