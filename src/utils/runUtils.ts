/**
 * 러닝 유틸리티 함수
 *
 * @deprecated 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 'runUtils/index.ts'에서 직접 import하세요.
 *
 * @example
 * // 기존 방식 (하위 호환)
 * import { getRunTime, getPace } from '../utils/runUtils';
 *
 * // 권장 방식
 * import { getRunTime, getPace } from '../utils/runUtils/index';
 */

// 모든 함수를 새 모듈에서 re-export
export {
  // 시간 관련
  getDate,
  getRunName,
  getRunTime,
  // 페이스 관련
  getFormattedPace,
  getPace,
  // 칼로리/케이던스 관련
  getCadence,
  getCalories,
  // 기하/좌표 관련
  checkPointSynced,
  findClosestPointIndex,
  telemetriesToSegment,
  // 텔레메트리 관련
  getTelemetriesWithoutLastFalse,
  // 러닝 저장
  saveRunning,
} from "./runUtils/index"

export type { SaveRunningProps } from "./runUtils/index"
