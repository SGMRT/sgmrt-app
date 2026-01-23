import {
  SaveRunningError,
  SaveRunningProps,
} from "@/src/utils/runUtils/saveRunning"
import type { Telemetry } from "@/src/apis/types/run"
import type { RawData, UserDashBoardData } from "@/src/types/run"

// Mock dependencies
jest.mock("@kingstinct/react-native-healthkit", () => ({
  AuthorizationStatus: { sharingAuthorized: 2 },
  authorizationStatusFor: jest.fn(() => 2),
  isHealthDataAvailableAsync: jest.fn(() => Promise.resolve(false)),
  saveWorkoutSample: jest.fn(),
  WorkoutActivityType: { running: 37 },
}))

jest.mock("@sentry/react-native", () => ({
  setContext: jest.fn(),
}))

jest.mock("expo-file-system", () => ({
  cacheDirectory: "/mock/cache/",
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 100 })),
}))

jest.mock("@/src/apis", () => ({
  postRun: jest.fn(),
  postCourseRun: jest.fn(),
}))

jest.mock("@/src/components/ui/feedback/toastConfig", () => ({
  showCompactToast: jest.fn(),
}))

jest.mock("@/src/utils/sentryTools", () => ({
  addPhase: jest.fn(),
  addWarn: jest.fn(),
  captureError: jest.fn(),
  trackDuration: jest.fn(() => ({ end: jest.fn() })),
  trackRunSaveFailure: jest.fn(),
  ERROR_PRIORITY: { HIGH: "HIGH" },
}))

jest.mock("@/src/features/run/utils/applyAltitudeBias", () => ({
  applyAltitudeBiasFromBestGPS: jest.fn((telemetries) => telemetries),
}))

jest.mock("@/src/apis/utils", () => ({
  encodeTelemetries: jest.fn((t) => t),
}))

// Helper functions
function createMockTelemetry(overrides: Partial<Telemetry> = {}): Telemetry {
  return {
    timeStamp: Date.now(),
    lat: 37.5,
    lng: 127.0,
    dist: 1000,
    pace: 300,
    alt: 10,
    cadence: 180,
    bpm: 150,
    isRunning: true,
    ...overrides,
  }
}

function createMockRawData(overrides: Partial<RawData> = {}): RawData {
  return {
    timestamp: Date.now(),
    latitude: 37.5,
    longitude: 127.0,
    altitude: 10,
    speed: 3.0,
    accuracy: 5,
    altitudeAccuracy: 3,
    pressure: 1013,
    course: 90,
    ...overrides,
  }
}

function createMockUserDashboardData(
  overrides: Partial<UserDashBoardData> = {}
): UserDashBoardData {
  return {
    totalDistance: 1000, // 1km - minimum is 100m
    totalCalories: 100,
    averagePace: 300,
    averageCadence: 180,
    recentPointsPace: 300,
    bpm: 150,
    totalElevationGain: 10,
    totalElevationLoss: -5,
    ...overrides,
  }
}

function createMockSaveRunningProps(
  overrides: Partial<SaveRunningProps> = {}
): SaveRunningProps {
  return {
    telemetries: [
      createMockTelemetry({ isRunning: true }),
      createMockTelemetry({ isRunning: true }),
    ],
    rawData: [createMockRawData()],
    userDashboardData: createMockUserDashboardData(),
    thumbnailUri: "/mock/thumbnail.jpg",
    runTime: 300, // 5 minutes
    isPublic: true,
    ...overrides,
  }
}

describe("SaveRunningError", () => {
  describe("에러 생성", () => {
    it("SHORT_DISTANCE 코드로 에러 생성", () => {
      const error = new SaveRunningError(
        "러닝 거리가 너무 짧습니다.",
        "SHORT_DISTANCE"
      )

      expect(error.message).toBe("러닝 거리가 너무 짧습니다.")
      expect(error.code).toBe("SHORT_DISTANCE")
      expect(error.name).toBe("SaveRunningError")
      expect(error instanceof Error).toBe(true)
    })

    it("NO_RUNNING_SEGMENT 코드로 에러 생성", () => {
      const error = new SaveRunningError(
        "러닝 데이터가 없습니다.",
        "NO_RUNNING_SEGMENT"
      )

      expect(error.code).toBe("NO_RUNNING_SEGMENT")
    })

    it("UPLOAD_FAILED 코드로 에러 생성", () => {
      const error = new SaveRunningError(
        "서버 응답이 올바르지 않습니다.",
        "UPLOAD_FAILED"
      )

      expect(error.code).toBe("UPLOAD_FAILED")
    })

    it("UNKNOWN 코드로 에러 생성", () => {
      const error = new SaveRunningError("알 수 없는 오류", "UNKNOWN")

      expect(error.code).toBe("UNKNOWN")
    })
  })

  describe("instanceof 체크", () => {
    it("SaveRunningError를 구별할 수 있음", () => {
      const saveError = new SaveRunningError("테스트", "SHORT_DISTANCE")
      const normalError = new Error("일반 에러")

      expect(saveError instanceof SaveRunningError).toBe(true)
      expect(normalError instanceof SaveRunningError).toBe(false)
    })
  })
})

describe("saveRunning", () => {
  let saveRunning: typeof import("@/src/utils/runUtils/saveRunning").saveRunning
  let postRun: jest.Mock
  let postCourseRun: jest.Mock
  let showCompactToast: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Re-import to get fresh mocks
    const apis = require("@/src/apis")
    postRun = apis.postRun
    postCourseRun = apis.postCourseRun

    const toast = require("@/src/components/ui/feedback/toastConfig")
    showCompactToast = toast.showCompactToast

    // Import saveRunning after mocks are set up
    const saveRunningModule = require("@/src/utils/runUtils/saveRunning")
    saveRunning = saveRunningModule.saveRunning
  })

  describe("거리 검증", () => {
    it("100m 미만 거리는 SHORT_DISTANCE 에러 throw", async () => {
      const props = createMockSaveRunningProps({
        userDashboardData: createMockUserDashboardData({ totalDistance: 50 }),
      })

      await expect(saveRunning(props)).rejects.toThrow("러닝 거리가 너무 짧습니다.")

      try {
        await saveRunning(props)
      } catch (error: any) {
        expect(error.code).toBe("SHORT_DISTANCE")
        expect(error.name).toBe("SaveRunningError")
      }

      expect(showCompactToast).toHaveBeenCalledWith(
        "러닝 거리가 너무 짧습니다."
      )
    })

    it("userDashboardData가 null이면 SHORT_DISTANCE 에러 throw", async () => {
      const props = createMockSaveRunningProps({
        userDashboardData: null as any,
      })

      await expect(saveRunning(props)).rejects.toThrow("러닝 거리가 너무 짧습니다.")
    })

    it("정확히 100m는 통과", async () => {
      postRun.mockResolvedValue({ runningId: 123 })

      const props = createMockSaveRunningProps({
        userDashboardData: createMockUserDashboardData({ totalDistance: 100 }),
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(123)
    })
  })

  describe("텔레메트리 검증", () => {
    it("모든 텔레메트리가 isRunning=false면 NO_RUNNING_SEGMENT 에러", async () => {
      const props = createMockSaveRunningProps({
        telemetries: [
          createMockTelemetry({ isRunning: false }),
          createMockTelemetry({ isRunning: false }),
        ],
      })

      await expect(saveRunning(props)).rejects.toThrow("러닝 데이터가 없습니다.")

      try {
        await saveRunning(props)
      } catch (error: any) {
        expect(error.code).toBe("NO_RUNNING_SEGMENT")
      }
    })

    it("마지막 isRunning=true 이후의 false는 제거됨", async () => {
      postRun.mockResolvedValue({ runningId: 123 })

      const props = createMockSaveRunningProps({
        telemetries: [
          createMockTelemetry({ isRunning: true }),
          createMockTelemetry({ isRunning: true }),
          createMockTelemetry({ isRunning: false }), // 제거됨
          createMockTelemetry({ isRunning: false }), // 제거됨
        ],
      })

      await saveRunning(props)

      // postRun이 호출되었으면 성공
      expect(postRun).toHaveBeenCalled()
    })
  })

  describe("API 응답 처리", () => {
    it("postRun 응답이 숫자면 { runningId: 숫자 } 반환", async () => {
      postRun.mockResolvedValue(123) // 숫자 직접 반환

      const props = createMockSaveRunningProps()
      const result = await saveRunning(props)

      expect(result).toEqual({ runningId: 123 })
    })

    it("postRun 응답이 객체면 runningId 추출", async () => {
      postRun.mockResolvedValue({ runningId: 456, otherData: "test" })

      const props = createMockSaveRunningProps()
      const result = await saveRunning(props)

      expect(result).toEqual({ runningId: 456 })
    })

    it("postRun 응답이 유효하지 않으면 UPLOAD_FAILED 에러", async () => {
      postRun.mockResolvedValue(null) // 유효하지 않은 응답

      const props = createMockSaveRunningProps()

      await expect(saveRunning(props)).rejects.toThrow("서버 응답이 올바르지 않습니다.")

      try {
        await saveRunning(props)
      } catch (error: any) {
        expect(error.code).toBe("UPLOAD_FAILED")
      }
    })

    it("postRun 응답이 undefined면 UPLOAD_FAILED 에러", async () => {
      postRun.mockResolvedValue(undefined)

      const props = createMockSaveRunningProps()

      await expect(saveRunning(props)).rejects.toThrow("서버 응답이 올바르지 않습니다.")
    })

    it("postRun 응답이 문자열이면 UPLOAD_FAILED 에러", async () => {
      postRun.mockResolvedValue("invalid")

      const props = createMockSaveRunningProps()

      await expect(saveRunning(props)).rejects.toThrow("서버 응답이 올바르지 않습니다.")
    })
  })

  describe("코스 러닝 저장", () => {
    it("courseId만 있으면 postCourseRun 호출", async () => {
      postCourseRun.mockResolvedValue(789)

      const props = createMockSaveRunningProps({
        courseId: 100,
      })

      const result = await saveRunning(props)

      expect(postCourseRun).toHaveBeenCalledWith(expect.any(FormData), 100)
      expect(result).toEqual({ runningId: 789, courseId: 100 })
    })

    it("courseId와 ghostRunningId가 있으면 GHOST 모드로 저장", async () => {
      postCourseRun.mockResolvedValue(999)

      const props = createMockSaveRunningProps({
        courseId: 100,
        ghostRunningId: 200,
      })

      const result = await saveRunning(props)

      expect(postCourseRun).toHaveBeenCalledWith(expect.any(FormData), 100)
      expect(result).toEqual({ runningId: 999, courseId: 100 })
    })
  })

  describe("재시도 로직", () => {
    it("API 실패 시 최대 3회 재시도", async () => {
      postRun
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(123) // 3번째에 성공

      const props = createMockSaveRunningProps()
      const result = await saveRunning(props)

      expect(postRun).toHaveBeenCalledTimes(3)
      expect(result.runningId).toBe(123)
    })

    it("3회 모두 실패하면 에러 throw", async () => {
      postRun.mockRejectedValue(new Error("Persistent network error"))

      const props = createMockSaveRunningProps()

      await expect(saveRunning(props)).rejects.toThrow("Persistent network error")
      expect(postRun).toHaveBeenCalledTimes(3)
    })
  })

  describe("썸네일 처리", () => {
    it("thumbnailUri가 null이어도 저장 진행", async () => {
      postRun.mockResolvedValue(123)

      const props = createMockSaveRunningProps({
        thumbnailUri: null,
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(123)
    })

    it("thumbnailUri가 빈 문자열이어도 저장 진행", async () => {
      postRun.mockResolvedValue(123)

      const props = createMockSaveRunningProps({
        thumbnailUri: "",
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(123)
    })
  })

  describe("반환 타입", () => {
    it("솔로 러닝은 runningId만 반환", async () => {
      postRun.mockResolvedValue(123)

      const props = createMockSaveRunningProps({
        courseId: undefined,
        ghostRunningId: undefined,
      })

      const result = await saveRunning(props)

      expect(result).toEqual({ runningId: 123 })
      expect(result.courseId).toBeUndefined()
    })

    it("코스 러닝은 runningId와 courseId 반환", async () => {
      postCourseRun.mockResolvedValue(456)

      const props = createMockSaveRunningProps({
        courseId: 100,
      })

      const result = await saveRunning(props)

      expect(result).toEqual({ runningId: 456, courseId: 100 })
    })
  })

  describe("대용량 텔레메트리 처리", () => {
    it("10,000개 텔레메트리 저장 성공", async () => {
      postRun.mockResolvedValue(123)

      const largeTelemetries = Array.from({ length: 10000 }, (_, i) =>
        createMockTelemetry({
          timeStamp: Date.now() + i * 1000,
          dist: i * 10,
          isRunning: true,
        })
      )

      const props = createMockSaveRunningProps({
        telemetries: largeTelemetries,
        userDashboardData: createMockUserDashboardData({
          totalDistance: 100000, // 100km
        }),
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(123)
      expect(postRun).toHaveBeenCalled()
    })

    it("50,000개 텔레메트리도 처리 가능", async () => {
      postRun.mockResolvedValue(456)

      const hugeTelemetries = Array.from({ length: 50000 }, (_, i) =>
        createMockTelemetry({
          timeStamp: Date.now() + i * 1000,
          dist: i * 5,
          isRunning: i % 100 !== 99, // 100개마다 한 번씩 pause
        })
      )

      const props = createMockSaveRunningProps({
        telemetries: hugeTelemetries,
        userDashboardData: createMockUserDashboardData({
          totalDistance: 250000, // 250km 울트라마라톤
        }),
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(456)
    })
  })

  describe("썸네일 캡처 실패 상황", () => {
    it("API가 썸네일 없이도 저장 성공 응답", async () => {
      postRun.mockResolvedValue(123)

      const props = createMockSaveRunningProps({
        thumbnailUri: null,
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(123)
      // postRun이 thumbnailUri 없이 호출됨
      expect(postRun).toHaveBeenCalled()
    })

    it("잘못된 thumbnailUri 경로도 API에 전달 (서버에서 처리)", async () => {
      postRun.mockResolvedValue(456)

      const props = createMockSaveRunningProps({
        thumbnailUri: "/invalid/memory/error/path.jpg",
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(456)
    })

    it("API가 썸네일 업로드 실패 시 전체 저장은 재시도", async () => {
      // 첫 번째 호출: 썸네일 관련 에러, 두 번째: 성공
      postRun
        .mockRejectedValueOnce(new Error("Thumbnail upload failed"))
        .mockResolvedValueOnce(789)

      const props = createMockSaveRunningProps({
        thumbnailUri: "/problematic/thumbnail.jpg",
      })

      const result = await saveRunning(props)

      expect(result.runningId).toBe(789)
      expect(postRun).toHaveBeenCalledTimes(2)
    })
  })
})
