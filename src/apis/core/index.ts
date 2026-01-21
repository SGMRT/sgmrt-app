/**
 * API 코어 모듈
 *
 * 에러 처리와 요청 유틸리티를 제공합니다.
 */

// 에러 클래스 및 유틸리티
export {
  AppError,
  BadRequestError,
  ForbiddenError,
  isAppError,
  isNetworkError,
  isServerError,
  isUnauthorizedError,
  NetworkError,
  normalizeError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from "./errors"

// 요청 유틸리티
export {
  apiRequest,
  apiRequestSafe,
  apiRequestWithRetry,
} from "./request"

export type {
  ApiError,
  ApiResponse,
  ApiResult,
  RetryOptions,
} from "./request"
