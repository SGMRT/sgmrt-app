/**
 * API 요청 유틸리티
 *
 * 일관된 에러 처리와 응답 타입을 제공합니다.
 */

import type { AxiosResponse } from "axios"

import { AppError, normalizeError } from "./errors"

/**
 * API 응답 래퍼 타입
 */
export interface ApiResult<T> {
  success: true
  data: T
}

/**
 * API 에러 래퍼 타입
 */
export interface ApiError {
  success: false
  error: AppError
}

/**
 * API 결과 유니온 타입
 */
export type ApiResponse<T> = ApiResult<T> | ApiError

/**
 * API 요청을 실행하고 통일된 에러 처리를 적용
 *
 * @example
 * ```typescript
 * // 성공 시 data 반환, 실패 시 AppError throw
 * const user = await apiRequest(() => server.get('/user'))
 *
 * // try-catch로 에러 처리
 * try {
 *   const user = await apiRequest(() => server.get('/user'))
 * } catch (error) {
 *   if (isUnauthorizedError(error)) {
 *     // 401 처리
 *   }
 * }
 * ```
 */
export async function apiRequest<T>(
  fn: () => Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const response = await fn()
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}

/**
 * API 요청을 실행하고 결과를 Result 타입으로 반환 (예외를 던지지 않음)
 *
 * @example
 * ```typescript
 * const result = await apiRequestSafe(() => server.get('/user'))
 *
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
 */
export async function apiRequestSafe<T>(
  fn: () => Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> {
  try {
    const response = await fn()
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: normalizeError(error) }
  }
}

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries?: number
  /** 재시도 간격 (ms, 기본: 1000) */
  delay?: number
  /** 재시도할 HTTP 상태 코드 (기본: 5xx) */
  retryStatusCodes?: number[]
  /** 지수 백오프 사용 여부 (기본: true) */
  exponentialBackoff?: boolean
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  retryStatusCodes: [500, 502, 503, 504],
  exponentialBackoff: true,
}

/**
 * 재시도 로직이 포함된 API 요청
 *
 * @example
 * ```typescript
 * const data = await apiRequestWithRetry(
 *   () => server.get('/data'),
 *   { maxRetries: 3, delay: 1000 }
 * )
 * ```
 */
export async function apiRequestWithRetry<T>(
  fn: () => Promise<AxiosResponse<T>>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: AppError | null = null

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fn()
      return response.data
    } catch (error) {
      lastError = normalizeError(error)

      // 재시도 가능한 에러인지 확인
      const shouldRetry =
        lastError.statusCode !== undefined &&
        opts.retryStatusCodes.includes(lastError.statusCode) &&
        attempt < opts.maxRetries

      if (!shouldRetry) {
        throw lastError
      }

      // 대기 시간 계산 (지수 백오프)
      const waitTime = opts.exponentialBackoff
        ? opts.delay * Math.pow(2, attempt)
        : opts.delay

      await sleep(waitTime)
    }
  }

  // 모든 재시도 실패
  throw lastError ?? new AppError("RETRY_EXHAUSTED", "모든 재시도가 실패했습니다")
}

/**
 * Promise 기반 sleep 함수
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
