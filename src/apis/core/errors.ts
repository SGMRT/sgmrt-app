/**
 * API 에러 처리를 위한 통일된 에러 클래스
 */

/**
 * 애플리케이션 기본 에러 클래스
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = "AppError"
    // Error.captureStackTrace이 있는 환경에서만 호출
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * 네트워크 에러 (오프라인, 타임아웃 등)
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super("NETWORK_ERROR", message, undefined, originalError)
    this.name = "NetworkError"
  }
}

/**
 * 인증 에러 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다", originalError?: unknown) {
    super("UNAUTHORIZED", message, 401, originalError)
    this.name = "UnauthorizedError"
  }
}

/**
 * 권한 없음 에러 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "접근 권한이 없습니다", originalError?: unknown) {
    super("FORBIDDEN", message, 403, originalError)
    this.name = "ForbiddenError"
  }
}

/**
 * 리소스 없음 에러 (404)
 */
export class NotFoundError extends AppError {
  constructor(message = "요청한 리소스를 찾을 수 없습니다", originalError?: unknown) {
    super("NOT_FOUND", message, 404, originalError)
    this.name = "NotFoundError"
  }
}

/**
 * 잘못된 요청 에러 (400)
 */
export class BadRequestError extends AppError {
  constructor(message = "잘못된 요청입니다", originalError?: unknown) {
    super("BAD_REQUEST", message, 400, originalError)
    this.name = "BadRequestError"
  }
}

/**
 * 서버 에러 (5xx)
 */
export class ServerError extends AppError {
  constructor(
    message = "서버에 문제가 발생했습니다",
    statusCode = 500,
    originalError?: unknown
  ) {
    super("SERVER_ERROR", message, statusCode, originalError)
    this.name = "ServerError"
  }
}

/**
 * 유효성 검증 에러
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    originalError?: unknown
  ) {
    super("VALIDATION_ERROR", message, 422, originalError)
    this.name = "ValidationError"
  }
}

/**
 * 에러 타입 가드 함수들
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError
}

/**
 * Axios 에러를 AppError로 변환
 */
export function normalizeError(error: unknown): AppError {
  // 이미 AppError인 경우 그대로 반환
  if (isAppError(error)) {
    return error
  }

  // Axios 에러 처리
  if (isAxiosError(error)) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.message
    const serverCode = error.response?.data?.code

    // 네트워크 에러 (response 없음)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return new NetworkError("요청 시간이 초과되었습니다", error)
      }
      return new NetworkError("네트워크 연결을 확인해주세요", error)
    }

    // HTTP 상태 코드별 처리
    switch (status) {
      case 400:
        return new BadRequestError(serverMessage || "잘못된 요청입니다", error)
      case 401:
        return new UnauthorizedError(serverMessage || "인증이 필요합니다", error)
      case 403:
        return new ForbiddenError(serverMessage || "접근 권한이 없습니다", error)
      case 404:
        return new NotFoundError(serverMessage || "요청한 리소스를 찾을 수 없습니다", error)
      case 422:
        return new ValidationError(serverMessage || "입력 값을 확인해주세요", undefined, error)
      default:
        if (status && status >= 500) {
          return new ServerError(
            serverMessage || "서버에 문제가 발생했습니다",
            status,
            error
          )
        }
    }

    // 기타 에러
    const message = serverCode
      ? `[${serverCode}] ${serverMessage || "알 수 없는 에러"}`
      : serverMessage || "알 수 없는 에러가 발생했습니다"

    return new AppError(serverCode || "UNKNOWN", message, status, error)
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    return new AppError("UNKNOWN", error.message, undefined, error)
  }

  // 기타
  return new AppError("UNKNOWN", "알 수 없는 에러가 발생했습니다", undefined, error)
}

/**
 * Axios 에러 타입 가드
 */
function isAxiosError(
  error: unknown
): error is {
  response?: {
    status?: number
    data?: { message?: string; code?: string }
  }
  code?: string
  message?: string
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as any).isAxiosError === true
  )
}
