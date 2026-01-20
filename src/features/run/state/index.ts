/**
 * Run Feature State Management
 *
 * React Context + Reducer 패턴을 사용한 러닝 상태 관리
 *
 * 구조:
 * - context.ts: 상태 타입 정의 (RunContext)
 * - reducer.ts: 상태 변경 로직
 * - actions.ts: 액션 타입 정의
 * - selectors.ts: 상태 선택 함수
 * - record.ts: 기록 데이터 빌드
 * - segments.ts: 세그먼트 관련
 * - stats.ts: 통계 관련
 * - telemetry.ts: 텔레메트리 빌드
 * - time.ts: 경과 시간 계산
 *
 * 참고: Zustand 기반 센서 상태는 ../store/ 폴더에서 관리
 */

// 상태 타입
export type { LiveActivityState, RunContext } from "./context"

// 리듀서
export { initialRunContext, routeKeyByStatus, runReducer } from "./reducer"
export type { RouteKey } from "./reducer"

// 액션 타입
export type { RunAction } from "./actions"

// 선택자
export {
  isRunningNow,
  selectLiveActivityPayload,
  selectPolylineSegments,
  selectStatsDisplay,
  selectUserLocation,
} from "./selectors"
export type { PolylineSeg } from "./selectors"

// 기록 빌드
export { buildUserRecordData } from "./record"

// 세그먼트
export { appendOne, appendSegmentMeta } from "./segments"
export type { SegmentMeta } from "./segments"

// 통계
export { DEFAULT_STATS, updateStats } from "./stats"
export type { RunningStats, UpdateStatsOptions } from "./stats"

// 텔레메트리 빌드
export { buildTelemetry } from "./telemetry"

// 시간 유틸
export { getElapsedMs } from "./time"
