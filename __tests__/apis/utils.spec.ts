import {
  camelToSnakeCase,
  getUpdateAttrs,
  encodeTelemetry,
  decodeTelemetry,
  encodeTelemetries,
  decodeTelemetries,
  handleError,
} from "@/src/apis/utils"
import { Telemetry, TelemetryCompact } from "@/src/apis/types/run"
import { AxiosError, AxiosHeaders } from "axios"

// 테스트용 텔레메트리 생성
const createTelemetry = (overrides: Partial<Telemetry> = {}): Telemetry => ({
  timeStamp: 1705312800000,
  lat: 37.566535,
  lng: 126.977969,
  dist: 1234.567,
  pace: 300.5,
  alt: 50.3,
  cadence: 168,
  bpm: 145,
  isRunning: true,
  ...overrides,
})

// 테스트용 압축 텔레메트리 생성
const createCompactTelemetry = (
  overrides: Partial<TelemetryCompact> = {}
): TelemetryCompact => ({
  t: 1705312800000,
  y: 37.566535,
  x: 126.977969,
  d: 1234.567,
  p: 300.5,
  e: 50.3,
  c: 168,
  b: 145,
  r: true,
  ...overrides,
})

describe("camelToSnakeCase", () => {
  it("camelCase를 SNAKE_CASE로 변환한다", () => {
    expect(camelToSnakeCase("userName")).toBe("USER_NAME")
    expect(camelToSnakeCase("firstName")).toBe("FIRST_NAME")
    expect(camelToSnakeCase("profileImageUrl")).toBe("PROFILE_IMAGE_URL")
  })

  it("이미 소문자인 문자열도 대문자로 변환한다", () => {
    expect(camelToSnakeCase("name")).toBe("NAME")
  })

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(camelToSnakeCase("")).toBe("")
  })

  it("연속된 대문자를 처리한다", () => {
    expect(camelToSnakeCase("userURL")).toBe("USER_U_R_L")
  })

  it("첫 글자가 대문자인 경우도 처리한다", () => {
    expect(camelToSnakeCase("UserName")).toBe("_USER_NAME")
  })
})

describe("getUpdateAttrs", () => {
  it("객체의 키들을 SNAKE_CASE 배열로 반환한다", () => {
    const data = {
      userName: "John",
      firstName: "John",
      lastName: "Doe",
    }

    const result = getUpdateAttrs(data)

    expect(result).toContain("USER_NAME")
    expect(result).toContain("FIRST_NAME")
    expect(result).toContain("LAST_NAME")
    expect(result).toHaveLength(3)
  })

  it("빈 객체는 빈 배열을 반환한다", () => {
    const result = getUpdateAttrs({})
    expect(result).toEqual([])
  })

  it("중첩 객체는 최상위 키만 변환한다", () => {
    const data = {
      user: { name: "John" },
      address: { city: "Seoul" },
    }

    const result = getUpdateAttrs(data)

    expect(result).toContain("USER")
    expect(result).toContain("ADDRESS")
    expect(result).toHaveLength(2)
  })
})

describe("encodeTelemetry", () => {
  it("Telemetry를 TelemetryCompact로 인코딩한다", () => {
    const telemetry = createTelemetry()
    const result = encodeTelemetry(telemetry)

    expect(result.t).toBe(telemetry.timeStamp)
    expect(result.x).toBe(telemetry.lng)
    expect(result.y).toBe(telemetry.lat)
    expect(result.d).toBe(telemetry.dist)
    expect(result.p).toBe(telemetry.pace)
    expect(result.e).toBe(telemetry.alt)
    expect(result.c).toBe(telemetry.cadence)
    expect(result.b).toBe(telemetry.bpm)
    expect(result.r).toBe(telemetry.isRunning)
  })

  it("위도/경도를 소수점 6자리로 반올림한다", () => {
    const telemetry = createTelemetry({
      lat: 37.5665351234567,
      lng: 126.9779691234567,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.y).toBe(37.566535)
    expect(result.x).toBe(126.977969)
  })

  it("거리를 소수점 3자리로 반올림한다", () => {
    const telemetry = createTelemetry({
      dist: 1234.567891234,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.d).toBe(1234.568)
  })

  it("페이스를 소수점 1자리로 반올림한다", () => {
    const telemetry = createTelemetry({
      pace: 300.56789,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.p).toBe(300.6)
  })

  it("고도를 소수점 1자리로 반올림한다", () => {
    const telemetry = createTelemetry({
      alt: 50.3456,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.e).toBe(50.3)
  })

  it("케이던스를 정수로 반올림한다", () => {
    const telemetry = createTelemetry({
      cadence: 168.7,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.c).toBe(169)
  })

  it("BPM을 정수로 반올림한다", () => {
    const telemetry = createTelemetry({
      bpm: 145.4,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.b).toBe(145)
  })

  it("소수점 자리수가 이미 적으면 그대로 유지한다", () => {
    const telemetry = createTelemetry({
      lat: 37.5,
      lng: 127,
      dist: 100,
      pace: 300,
      alt: 50,
    })

    const result = encodeTelemetry(telemetry)

    expect(result.y).toBe(37.5)
    expect(result.x).toBe(127)
    expect(result.d).toBe(100)
    expect(result.p).toBe(300)
    expect(result.e).toBe(50)
  })
})

describe("decodeTelemetry", () => {
  it("TelemetryCompact를 Telemetry로 디코딩한다", () => {
    const compact = createCompactTelemetry()
    const result = decodeTelemetry(compact)

    expect(result.timeStamp).toBe(compact.t)
    expect(result.lat).toBe(compact.y)
    expect(result.lng).toBe(compact.x)
    expect(result.dist).toBe(compact.d)
    expect(result.pace).toBe(compact.p)
    expect(result.alt).toBe(compact.e)
    expect(result.cadence).toBe(compact.c)
    expect(result.bpm).toBe(compact.b)
    expect(result.isRunning).toBe(compact.r)
  })

  it("isRunning이 false인 경우도 처리한다", () => {
    const compact = createCompactTelemetry({ r: false })
    const result = decodeTelemetry(compact)

    expect(result.isRunning).toBe(false)
  })
})

describe("encodeTelemetries / decodeTelemetries", () => {
  it("여러 텔레메트리를 인코딩한다", () => {
    const telemetries = [
      createTelemetry({ lat: 37.5 }),
      createTelemetry({ lat: 37.6 }),
      createTelemetry({ lat: 37.7 }),
    ]

    const result = encodeTelemetries(telemetries)

    expect(result).toHaveLength(3)
    expect(result[0].y).toBe(37.5)
    expect(result[1].y).toBe(37.6)
    expect(result[2].y).toBe(37.7)
  })

  it("여러 압축 텔레메트리를 디코딩한다", () => {
    const compacts = [
      createCompactTelemetry({ y: 37.5 }),
      createCompactTelemetry({ y: 37.6 }),
      createCompactTelemetry({ y: 37.7 }),
    ]

    const result = decodeTelemetries(compacts)

    expect(result).toHaveLength(3)
    expect(result[0].lat).toBe(37.5)
    expect(result[1].lat).toBe(37.6)
    expect(result[2].lat).toBe(37.7)
  })

  it("빈 배열을 처리한다", () => {
    expect(encodeTelemetries([])).toEqual([])
    expect(decodeTelemetries([])).toEqual([])
  })

  it("인코딩 후 디코딩하면 원본과 유사하다", () => {
    const original = createTelemetry()
    const encoded = encodeTelemetry(original)
    const decoded = decodeTelemetry(encoded)

    expect(decoded.timeStamp).toBe(original.timeStamp)
    expect(decoded.lat).toBeCloseTo(original.lat, 5)
    expect(decoded.lng).toBeCloseTo(original.lng, 5)
    expect(decoded.dist).toBeCloseTo(original.dist, 2)
    expect(decoded.pace).toBeCloseTo(original.pace, 0)
    expect(decoded.alt).toBeCloseTo(original.alt, 0)
    expect(decoded.isRunning).toBe(original.isRunning)
  })
})

describe("handleError", () => {
  const createAxiosError = (
    status: number,
    data?: { code: string; message: string }
  ): AxiosError => {
    const error = new Error("Test error") as AxiosError
    error.isAxiosError = true
    error.response = {
      status,
      data,
      statusText: "Error",
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
    return error
  }

  it("Axios 에러가 아니면 그대로 throw한다", () => {
    const error = new Error("Regular error")

    expect(() => handleError(error)).toThrow("Regular error")
  })

  it("G-001 에러 코드를 처리한다", () => {
    const error = createAxiosError(400, {
      code: "G-001",
      message: "Invalid request",
    })

    expect(() => handleError(error)).toThrow(
      "[G-001] 유효하지 않은 요청입니다."
    )
  })

  it("G-002 에러 코드를 처리한다", () => {
    const error = createAxiosError(409, {
      code: "G-002",
      message: "Already exists",
    })

    expect(() => handleError(error)).toThrow(
      "[G-002] 이미 존재하는 요청입니다."
    )
  })

  it("G-007 에러 코드를 처리한다", () => {
    const error = createAxiosError(400, {
      code: "G-007",
      message: "Invalid input",
    })

    expect(() => handleError(error)).toThrow("[G-007] 잘못된 입력값입니다.")
  })

  it("M-001 에러 코드를 처리한다", () => {
    const error = createAxiosError(404, {
      code: "M-001",
      message: "Member not found",
    })

    expect(() => handleError(error)).toThrow(
      "[M-001] 회원 정보 조회를 실패했습니다."
    )
  })

  it("M-005 에러 코드를 처리한다", () => {
    const error = createAxiosError(404, {
      code: "M-005",
      message: "No running data",
    })

    expect(() => handleError(error)).toThrow(
      "[M-005] 회원의 러닝 정보가 존재하지 않습니다."
    )
  })

  it("C-001 에러 코드를 처리한다", () => {
    const error = createAxiosError(404, {
      code: "C-001",
      message: "Course not found",
    })

    expect(() => handleError(error)).toThrow(
      "[C-001] 코스 정보 조회를 실패했습니다."
    )
  })

  it("알 수 없는 커스텀 에러 코드는 원본 메시지를 사용한다", () => {
    const error = createAxiosError(500, {
      code: "X-999",
      message: "Unknown error",
    })

    expect(() => handleError(error)).toThrow("[X-999] Unknown error")
  })

  it("429 상태 코드를 처리한다", () => {
    const error = createAxiosError(429)

    expect(() => handleError(error)).toThrow("[429] 요청 횟수를 초과했습니다.")
  })

  it("커스텀 에러가 없는 Axios 에러는 그대로 throw한다", () => {
    const error = createAxiosError(500)

    expect(() => handleError(error)).toThrow()
  })
})
