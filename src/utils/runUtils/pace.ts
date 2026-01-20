/**
 * 페이스 관련 유틸리티 함수
 */

/**
 * 거리와 시간으로 페이스 계산 (초/km)
 * @param timeInSec 시간 (초)
 * @param distanceInMeters 거리 (미터)
 * @returns 페이스 (초/km), 유효하지 않으면 0
 */
export function getPace(timeInSec: number, distanceInMeters: number): number {
  if (distanceInMeters <= 0 || timeInSec <= 0) return 0
  const distanceInKm = distanceInMeters / 1000

  const paceInSec = timeInSec / distanceInKm // 초/km
  return Number(paceInSec.toFixed(2))
}

// Right Single Quotation Mark (U+2019)
const SINGLE_QUOTE = "\u2019"
// Right Double Quotation Mark (U+201D)
const DOUBLE_QUOTE = "\u201D"

/**
 * 페이스를 M'SS" 형식으로 변환
 * @param paceInSec 페이스 (초/km)
 * @returns 포맷팅된 페이스 문자열
 */
export function getFormattedPace(paceInSec: number): string {
  const minutes = Math.floor(paceInSec / 60)
  const seconds = Math.floor(paceInSec % 60)
  return `${minutes}${SINGLE_QUOTE}${seconds.toString().padStart(2, "0")}${DOUBLE_QUOTE}`
}
