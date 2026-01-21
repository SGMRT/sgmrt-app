import {
  AppError,
  NetworkError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ServerError,
  ValidationError,
  isAppError,
  isNetworkError,
  isUnauthorizedError,
  isServerError,
  normalizeError,
} from "@/src/apis/core/errors"

describe("AppError 클래스 계층", () => {
  describe("AppError", () => {
    it("기본 속성을 올바르게 설정한다", () => {
      const error = new AppError("TEST_CODE", "테스트 메시지", 500, new Error("원본"))

      expect(error.code).toBe("TEST_CODE")
      expect(error.message).toBe("테스트 메시지")
      expect(error.statusCode).toBe(500)
      expect(error.originalError).toBeInstanceOf(Error)
      expect(error.name).toBe("AppError")
    })

    it("statusCode와 originalError 없이 생성할 수 있다", () => {
      const error = new AppError("TEST_CODE", "테스트 메시지")

      expect(error.code).toBe("TEST_CODE")
      expect(error.message).toBe("테스트 메시지")
      expect(error.statusCode).toBeUndefined()
      expect(error.originalError).toBeUndefined()
    })

    it("Error를 상속한다", () => {
      const error = new AppError("TEST", "메시지")

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe("NetworkError", () => {
    it("올바른 코드와 이름을 가진다", () => {
      const error = new NetworkError("네트워크 오류")

      expect(error.code).toBe("NETWORK_ERROR")
      expect(error.name).toBe("NetworkError")
      expect(error.statusCode).toBeUndefined()
    })

    it("원본 에러를 저장한다", () => {
      const original = new Error("원본")
      const error = new NetworkError("네트워크 오류", original)

      expect(error.originalError).toBe(original)
    })
  })

  describe("UnauthorizedError", () => {
    it("기본 메시지와 401 상태 코드를 가진다", () => {
      const error = new UnauthorizedError()

      expect(error.code).toBe("UNAUTHORIZED")
      expect(error.message).toBe("인증이 필요합니다")
      expect(error.statusCode).toBe(401)
      expect(error.name).toBe("UnauthorizedError")
    })

    it("커스텀 메시지를 지원한다", () => {
      const error = new UnauthorizedError("토큰이 만료되었습니다")

      expect(error.message).toBe("토큰이 만료되었습니다")
    })
  })

  describe("ForbiddenError", () => {
    it("기본 메시지와 403 상태 코드를 가진다", () => {
      const error = new ForbiddenError()

      expect(error.code).toBe("FORBIDDEN")
      expect(error.message).toBe("접근 권한이 없습니다")
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe("ForbiddenError")
    })
  })

  describe("NotFoundError", () => {
    it("기본 메시지와 404 상태 코드를 가진다", () => {
      const error = new NotFoundError()

      expect(error.code).toBe("NOT_FOUND")
      expect(error.message).toBe("요청한 리소스를 찾을 수 없습니다")
      expect(error.statusCode).toBe(404)
      expect(error.name).toBe("NotFoundError")
    })
  })

  describe("BadRequestError", () => {
    it("기본 메시지와 400 상태 코드를 가진다", () => {
      const error = new BadRequestError()

      expect(error.code).toBe("BAD_REQUEST")
      expect(error.message).toBe("잘못된 요청입니다")
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe("BadRequestError")
    })
  })

  describe("ServerError", () => {
    it("기본 메시지와 500 상태 코드를 가진다", () => {
      const error = new ServerError()

      expect(error.code).toBe("SERVER_ERROR")
      expect(error.message).toBe("서버에 문제가 발생했습니다")
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe("ServerError")
    })

    it("커스텀 상태 코드를 지원한다", () => {
      const error = new ServerError("서비스 점검 중", 503)

      expect(error.statusCode).toBe(503)
      expect(error.message).toBe("서비스 점검 중")
    })
  })

  describe("ValidationError", () => {
    it("기본 속성과 422 상태 코드를 가진다", () => {
      const error = new ValidationError("이메일 형식이 올바르지 않습니다", "email")

      expect(error.code).toBe("VALIDATION_ERROR")
      expect(error.message).toBe("이메일 형식이 올바르지 않습니다")
      expect(error.statusCode).toBe(422)
      expect(error.field).toBe("email")
      expect(error.name).toBe("ValidationError")
    })

    it("field 없이 생성할 수 있다", () => {
      const error = new ValidationError("유효성 검증 실패")

      expect(error.field).toBeUndefined()
    })
  })
})

describe("타입 가드 함수들", () => {
  describe("isAppError", () => {
    it("AppError 인스턴스에 true를 반환한다", () => {
      expect(isAppError(new AppError("TEST", "msg"))).toBe(true)
    })

    it("AppError 하위 클래스에 true를 반환한다", () => {
      expect(isAppError(new NetworkError("msg"))).toBe(true)
      expect(isAppError(new UnauthorizedError())).toBe(true)
      expect(isAppError(new ServerError())).toBe(true)
    })

    it("일반 Error에 false를 반환한다", () => {
      expect(isAppError(new Error("msg"))).toBe(false)
    })

    it("null/undefined에 false를 반환한다", () => {
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
    })

    it("문자열에 false를 반환한다", () => {
      expect(isAppError("error")).toBe(false)
    })
  })

  describe("isNetworkError", () => {
    it("NetworkError에만 true를 반환한다", () => {
      expect(isNetworkError(new NetworkError("msg"))).toBe(true)
      expect(isNetworkError(new AppError("TEST", "msg"))).toBe(false)
      expect(isNetworkError(new UnauthorizedError())).toBe(false)
    })
  })

  describe("isUnauthorizedError", () => {
    it("UnauthorizedError에만 true를 반환한다", () => {
      expect(isUnauthorizedError(new UnauthorizedError())).toBe(true)
      expect(isUnauthorizedError(new AppError("TEST", "msg"))).toBe(false)
      expect(isUnauthorizedError(new ForbiddenError())).toBe(false)
    })
  })

  describe("isServerError", () => {
    it("ServerError에만 true를 반환한다", () => {
      expect(isServerError(new ServerError())).toBe(true)
      expect(isServerError(new AppError("TEST", "msg"))).toBe(false)
      expect(isServerError(new NetworkError("msg"))).toBe(false)
    })
  })
})

describe("normalizeError", () => {
  const createAxiosError = (config: {
    status?: number
    message?: string
    code?: string
    errorCode?: string
  }) => ({
    isAxiosError: true,
    response: config.status
      ? {
          status: config.status,
          data: {
            message: config.message,
            code: config.code,
          },
        }
      : undefined,
    code: config.errorCode,
    message: config.message || "Axios error",
  })

  describe("AppError 통과", () => {
    it("이미 AppError인 경우 그대로 반환한다", () => {
      const original = new UnauthorizedError("토큰 만료")
      const result = normalizeError(original)

      expect(result).toBe(original)
    })
  })

  describe("Axios 네트워크 에러 처리", () => {
    it("response 없는 경우 NetworkError를 반환한다", () => {
      const axiosError = createAxiosError({})
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(NetworkError)
      expect(result.message).toBe("네트워크 연결을 확인해주세요")
    })

    it("타임아웃(ECONNABORTED)인 경우 타임아웃 메시지를 반환한다", () => {
      const axiosError = createAxiosError({ errorCode: "ECONNABORTED" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(NetworkError)
      expect(result.message).toBe("요청 시간이 초과되었습니다")
    })
  })

  describe("HTTP 상태 코드별 처리", () => {
    it("400 에러를 BadRequestError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 400, message: "잘못된 파라미터" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(BadRequestError)
      expect(result.message).toBe("잘못된 파라미터")
    })

    it("400 에러의 기본 메시지를 사용한다", () => {
      const axiosError = createAxiosError({ status: 400 })
      const result = normalizeError(axiosError)

      expect(result.message).toBe("잘못된 요청입니다")
    })

    it("401 에러를 UnauthorizedError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 401, message: "토큰 만료" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(UnauthorizedError)
      expect(result.message).toBe("토큰 만료")
    })

    it("403 에러를 ForbiddenError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 403, message: "권한 없음" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(ForbiddenError)
      expect(result.message).toBe("권한 없음")
    })

    it("404 에러를 NotFoundError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 404, message: "사용자를 찾을 수 없습니다" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(NotFoundError)
      expect(result.message).toBe("사용자를 찾을 수 없습니다")
    })

    it("422 에러를 ValidationError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 422, message: "이메일 형식 오류" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(ValidationError)
      expect(result.message).toBe("이메일 형식 오류")
    })

    it("5xx 에러를 ServerError로 변환한다", () => {
      const axiosError500 = createAxiosError({ status: 500, message: "내부 서버 오류" })
      const result500 = normalizeError(axiosError500)

      expect(result500).toBeInstanceOf(ServerError)
      expect(result500.statusCode).toBe(500)

      const axiosError503 = createAxiosError({ status: 503, message: "서비스 점검" })
      const result503 = normalizeError(axiosError503)

      expect(result503).toBeInstanceOf(ServerError)
      expect(result503.statusCode).toBe(503)
    })

    it("5xx 에러의 기본 메시지를 사용한다", () => {
      const axiosError = createAxiosError({ status: 502 })
      const result = normalizeError(axiosError)

      expect(result.message).toBe("서버에 문제가 발생했습니다")
    })
  })

  describe("기타 Axios 에러 처리", () => {
    it("알 수 없는 상태 코드는 AppError로 변환한다", () => {
      const axiosError = createAxiosError({ status: 418, message: "I'm a teapot", code: "TEAPOT" })
      const result = normalizeError(axiosError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe("TEAPOT")
      expect(result.message).toBe("[TEAPOT] I'm a teapot")
      expect(result.statusCode).toBe(418)
    })

    it("코드 없는 알 수 없는 에러를 처리한다", () => {
      const axiosError = createAxiosError({ status: 418, message: "알 수 없음" })
      const result = normalizeError(axiosError)

      expect(result.code).toBe("UNKNOWN")
      expect(result.message).toBe("알 수 없음")
    })

    it("메시지도 코드도 없는 경우 기본값을 사용한다", () => {
      const axiosError = createAxiosError({ status: 418 })
      const result = normalizeError(axiosError)

      expect(result.message).toBe("알 수 없는 에러가 발생했습니다")
    })
  })

  describe("일반 Error 처리", () => {
    it("일반 Error를 AppError로 변환한다", () => {
      const error = new Error("일반 에러")
      const result = normalizeError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe("UNKNOWN")
      expect(result.message).toBe("일반 에러")
      expect(result.originalError).toBe(error)
    })
  })

  describe("알 수 없는 타입 처리", () => {
    it("문자열을 AppError로 변환한다", () => {
      const result = normalizeError("문자열 에러")

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe("UNKNOWN")
      expect(result.message).toBe("알 수 없는 에러가 발생했습니다")
      expect(result.originalError).toBe("문자열 에러")
    })

    it("null을 AppError로 변환한다", () => {
      const result = normalizeError(null)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe("UNKNOWN")
    })

    it("객체를 AppError로 변환한다", () => {
      const result = normalizeError({ custom: "error" })

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe("UNKNOWN")
    })
  })
})
