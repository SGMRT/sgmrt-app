/**
 * React Query의 Query Key 중앙 관리
 *
 * 모든 query key를 이 파일에서 정의하여 일관성과 타입 안정성을 보장합니다.
 *
 * @example
 * ```typescript
 * import { queryKeys } from '@/src/apis/queryKeys';
 *
 * // useQuery에서 사용
 * useQuery({
 *   queryKey: queryKeys.user.info(),
 *   queryFn: getUserInfo,
 * });
 *
 * // invalidateQueries에서 사용
 * queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
 * ```
 */

// 공통 요청 파라미터 타입
export interface RunsRequest {
  startEpoch: number
  endEpoch: number
  filteredBy?: string
  shouldRefresh?: number
}

export interface CoursesRequest {
  refreshKey?: number
}

export interface NoticesRequest {
  selectedTab: string
}

/**
 * Query Key Factory 함수들
 *
 * 계층 구조:
 * - all: 해당 도메인의 모든 쿼리 무효화에 사용
 * - list: 목록 쿼리
 * - detail: 상세 쿼리
 */
export const queryKeys = {
  /**
   * 사용자 관련 쿼리 키
   */
  user: {
    all: ["user"] as const,
    info: () => [...queryKeys.user.all, "info"] as const,
    settings: () => [...queryKeys.user.all, "settings"] as const,
    courses: () => [...queryKeys.user.all, "courses"] as const,
  },

  /**
   * 코스 관련 쿼리 키
   */
  courses: {
    all: ["courses"] as const,
    list: (params?: CoursesRequest) =>
      params
        ? ([...queryKeys.courses.all, params] as const)
        : queryKeys.courses.all,
    detail: (id: number) => [...queryKeys.courses.all, "detail", id] as const,
    preface: (id: number) =>
      [...queryKeys.courses.all, "preface", id] as const,
  },

  /**
   * 러닝 기록 관련 쿼리 키
   */
  runs: {
    all: ["runs"] as const,
    list: (params?: RunsRequest) =>
      params
        ? ([
            ...queryKeys.runs.all,
            params.startEpoch,
            params.endEpoch,
            params.filteredBy,
            params.shouldRefresh,
          ] as const)
        : queryKeys.runs.all,
    byCourse: (courseId: number) =>
      [...queryKeys.runs.all, "byCourse", courseId] as const,
    result: (runningId: number) =>
      [...queryKeys.runs.all, "result", runningId] as const,
    matchResult: (runningId: number) =>
      [...queryKeys.runs.all, "matchResult", runningId] as const,
    days: (year: number, month: number) =>
      [...queryKeys.runs.all, "days", year, month] as const,
  },

  /**
   * 페이스메이커 관련 쿼리 키
   */
  pacemaker: {
    all: ["pacemaker"] as const,
    byCourse: (courseId: number) =>
      [...queryKeys.pacemaker.all, "byCourse", courseId] as const,
    detail: (pacemakerId: number) =>
      [...queryKeys.pacemaker.all, "detail", pacemakerId] as const,
  },

  /**
   * 공지사항 관련 쿼리 키
   */
  notices: {
    all: ["notices"] as const,
    list: (params?: NoticesRequest) =>
      params
        ? ([...queryKeys.notices.all, params.selectedTab] as const)
        : queryKeys.notices.all,
    detail: (noticeId: string | number) =>
      [...queryKeys.notices.all, "detail", noticeId] as const,
    active: () => [...queryKeys.notices.all, "active"] as const,
  },
} as const

/**
 * Query Key 타입 추출 헬퍼
 *
 * @example
 * ```typescript
 * type UserInfoKey = QueryKeyType<typeof queryKeys.user.info>;
 * // readonly ["user", "info"]
 * ```
 */
export type QueryKeyType<T extends (...args: any[]) => readonly unknown[]> =
  ReturnType<T>

/**
 * Legacy Query Key 매핑 (하위 호환성)
 *
 * 기존 코드에서 사용하던 문자열 배열 키를 새로운 factory 함수로 매핑
 *
 * @deprecated 새로운 코드에서는 queryKeys를 직접 사용하세요
 */
export const legacyKeyMap = {
  // User
  '["user", "info"]': queryKeys.user.info,
  '["user-courses"]': queryKeys.user.courses,

  // Courses
  '["courses"]': () => queryKeys.courses.all,
  '["course", id]': queryKeys.courses.detail,

  // Runs
  '["runs"]': () => queryKeys.runs.all,
  '["runsByCourse", courseId]': queryKeys.runs.byCourse,
  '["result", runningId]': queryKeys.runs.result,
  '["match-result", runningId]': queryKeys.runs.matchResult,

  // Pacemaker
  '["pacemaker", courseId]': queryKeys.pacemaker.byCourse,
  '["pacemakerDetail", pacemakerId]': queryKeys.pacemaker.detail,

  // Notices
  '["notices", selectedTab]': queryKeys.notices.list,
  '["notice", noticeId]': queryKeys.notices.detail,
  '["active-notice"]': queryKeys.notices.active,
} as const
