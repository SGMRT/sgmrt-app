import type { AxiosResponse } from "axios"

import {
  apiRequest,
  apiRequestSafe,
  apiRequestWithRetry,
  ApiResult,
  ApiError,
} from "@/src/apis/core/request"
import { AppError, ServerError, BadRequestError } from "@/src/apis/core/errors"

const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any,
})

const createMockAxiosError = (status: number, message?: string) => ({
  isAxiosError: true,
  response: {
    status,
    data: { message },
  },
  message: message || "Request failed",
})

describe("apiRequest", () => {
  it("성공 시 응답 데이터를 반환한다", async () => {
    const mockData = { id: 1, name: "테스트" }
    const fn = jest.fn().mockResolvedValue(createMockResponse(mockData))

    const result = await apiRequest(fn)

    expect(result).toEqual(mockData)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("실패 시 정규화된 AppError를 던진다", async () => {
    const axiosError = createMockAxiosError(401, "Unauthorized")
    const fn = jest.fn().mockRejectedValue(axiosError)

    await expect(apiRequest(fn)).rejects.toThrow()
    await expect(apiRequest(fn)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    })
  })

  it("네트워크 에러를 NetworkError로 변환한다", async () => {
    const networkError = { isAxiosError: true, message: "Network Error" }
    const fn = jest.fn().mockRejectedValue(networkError)

    await expect(apiRequest(fn)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
  })
})

describe("apiRequestSafe", () => {
  it("성공 시 success: true와 data를 반환한다", async () => {
    const mockData = { id: 1, name: "테스트" }
    const fn = jest.fn().mockResolvedValue(createMockResponse(mockData))

    const result = await apiRequestSafe(fn)

    expect(result.success).toBe(true)
    expect((result as ApiResult<typeof mockData>).data).toEqual(mockData)
  })

  it("실패 시 success: false와 error를 반환한다 (예외를 던지지 않음)", async () => {
    const axiosError = createMockAxiosError(500, "Server Error")
    const fn = jest.fn().mockRejectedValue(axiosError)

    const result = await apiRequestSafe(fn)

    expect(result.success).toBe(false)
    expect((result as ApiError).error).toBeInstanceOf(AppError)
    expect((result as ApiError).error.statusCode).toBe(500)
  })

  it("에러 타입을 올바르게 식별한다", async () => {
    const axiosError = createMockAxiosError(404, "Not Found")
    const fn = jest.fn().mockRejectedValue(axiosError)

    const result = await apiRequestSafe(fn)

    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND")
    } else {
      fail("Expected failure result")
    }
  })
})

describe("apiRequestWithRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("성공 시 즉시 결과를 반환한다", async () => {
    const mockData = { id: 1 }
    const fn = jest.fn().mockResolvedValue(createMockResponse(mockData))

    const resultPromise = apiRequestWithRetry(fn)
    const result = await resultPromise

    expect(result).toEqual(mockData)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("5xx 에러 시 재시도한다", async () => {
    const mockData = { id: 1 }
    const fn = jest
      .fn()
      .mockRejectedValueOnce(createMockAxiosError(500, "Server Error"))
      .mockRejectedValueOnce(createMockAxiosError(503, "Service Unavailable"))
      .mockResolvedValueOnce(createMockResponse(mockData))

    const resultPromise = apiRequestWithRetry(fn, { maxRetries: 3, delay: 100 })

    // 첫 번째 시도 실패 후 대기
    await jest.advanceTimersByTimeAsync(100)
    // 두 번째 시도 실패 후 대기 (지수 백오프: 200ms)
    await jest.advanceTimersByTimeAsync(200)

    const result = await resultPromise

    expect(result).toEqual(mockData)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("재시도 불가능한 에러(4xx)는 즉시 던진다", async () => {
    const fn = jest.fn().mockRejectedValue(createMockAxiosError(400, "Bad Request"))

    await expect(apiRequestWithRetry(fn, { maxRetries: 3 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      statusCode: 400,
    })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("401 에러는 재시도하지 않는다", async () => {
    const fn = jest.fn().mockRejectedValue(createMockAxiosError(401, "Unauthorized"))

    await expect(apiRequestWithRetry(fn)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("maxRetries 횟수만큼 재시도 후 실패한다", async () => {
    const fn = jest.fn().mockRejectedValue(createMockAxiosError(500, "Server Error"))

    let caughtError: any = null
    const resultPromise = apiRequestWithRetry(fn, { maxRetries: 2, delay: 100 }).catch((e) => {
      caughtError = e
    })

    // 모든 타이머를 실행하여 재시도 완료
    await jest.runAllTimersAsync()
    await resultPromise

    expect(caughtError).not.toBeNull()
    expect(caughtError.code).toBe("SERVER_ERROR")
    expect(caughtError.statusCode).toBe(500)

    // 초기 시도(1) + 재시도(2) = 3번 호출
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("지수 백오프를 적용한다", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockResolvedValueOnce(createMockResponse({ ok: true }))

    const resultPromise = apiRequestWithRetry(fn, {
      maxRetries: 3,
      delay: 1000,
      exponentialBackoff: true,
    })

    // 첫 번째 재시도: 1000ms
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)

    // 두 번째 재시도: 2000ms (1000 * 2^1)
    await jest.advanceTimersByTimeAsync(2000)
    expect(fn).toHaveBeenCalledTimes(3)

    // 세 번째 재시도: 4000ms (1000 * 2^2)
    await jest.advanceTimersByTimeAsync(4000)
    expect(fn).toHaveBeenCalledTimes(4)

    await resultPromise
  })

  it("지수 백오프 없이 일정한 간격으로 재시도한다", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockResolvedValueOnce(createMockResponse({ ok: true }))

    const resultPromise = apiRequestWithRetry(fn, {
      maxRetries: 2,
      delay: 500,
      exponentialBackoff: false,
    })

    await jest.advanceTimersByTimeAsync(500)
    expect(fn).toHaveBeenCalledTimes(2)

    await jest.advanceTimersByTimeAsync(500)
    expect(fn).toHaveBeenCalledTimes(3)

    await resultPromise
  })

  it("커스텀 retryStatusCodes를 지원한다", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(createMockAxiosError(429, "Too Many Requests"))
      .mockResolvedValueOnce(createMockResponse({ ok: true }))

    const resultPromise = apiRequestWithRetry(fn, {
      maxRetries: 1,
      delay: 100,
      retryStatusCodes: [429, 500],
    })

    await jest.advanceTimersByTimeAsync(100)

    const result = await resultPromise
    expect(result).toEqual({ ok: true })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("retryStatusCodes에 없는 상태 코드는 재시도하지 않는다", async () => {
    const fn = jest.fn().mockRejectedValue(createMockAxiosError(502, "Bad Gateway"))

    // 기본 retryStatusCodes에 502가 포함되어 있지만, 커스텀 설정에서 제외
    await expect(
      apiRequestWithRetry(fn, {
        maxRetries: 3,
        retryStatusCodes: [500, 503],
      })
    ).rejects.toMatchObject({
      statusCode: 502,
    })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("기본 옵션을 사용한다", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(createMockAxiosError(500, "Error"))
      .mockResolvedValueOnce(createMockResponse({ ok: true }))

    const resultPromise = apiRequestWithRetry(fn)

    // 기본 delay: 1000ms
    await jest.advanceTimersByTimeAsync(1000)

    const result = await resultPromise
    expect(result).toEqual({ ok: true })
  })
})

describe("타입 안전성", () => {
  it("ApiResult 타입이 올바르게 추론된다", async () => {
    interface User {
      id: number
      name: string
    }

    const mockUser: User = { id: 1, name: "테스트" }
    const fn = jest.fn().mockResolvedValue(createMockResponse(mockUser))

    const result = await apiRequest<User>(fn)

    // 타입 체크: result는 User 타입이어야 함
    expect(result.id).toBe(1)
    expect(result.name).toBe("테스트")
  })

  it("ApiResponse 유니온 타입을 올바르게 처리한다", async () => {
    interface Data {
      value: string
    }

    const fn = jest.fn().mockResolvedValue(createMockResponse({ value: "test" }))

    const result = await apiRequestSafe<Data>(fn)

    // 타입 가드로 분기 처리
    if (result.success) {
      expect(result.data.value).toBe("test")
    } else {
      fail("Expected success")
    }
  })
})
