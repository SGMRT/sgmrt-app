/**
 * 러닝 데이터 저장 로직
 */

import {
  AuthorizationStatus,
  authorizationStatusFor,
  isHealthDataAvailableAsync,
  ObjectTypeIdentifier,
  QuantitySampleForSaving,
  saveWorkoutSample,
  WorkoutActivityType,
} from "@kingstinct/react-native-healthkit"
import * as Sentry from "@sentry/react-native"
import * as FileSystem from "expo-file-system"

import { postCourseRun, postRun } from "../../apis"
import {
  BaseRunning,
  CourseGhostRunning,
  CourseSoloRunning,
  RunRecord,
  Telemetry,
} from "../../apis/types/run"
import { encodeTelemetries } from "../../apis/utils"
import { showCompactToast } from "@/src/components/ui/feedback/toastConfig"
import { applyAltitudeBiasFromBestGPS } from "../../features/run/utils/applyAltitudeBias"
import { RawData, UserDashBoardData } from "../../types/run"
import {
  addPhase,
  addWarn,
  captureError,
  trackDuration,
  ERROR_PRIORITY,
  trackRunSaveFailure,
  type RunSaveMode,
} from "../sentryTools"
import { getRunName } from "./time"

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries - 1) {
        // 지수 백오프: 1s, 2s, 4s...
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt))
        )
      }
    }
  }
  throw lastError as Error
}

const canShare = (objectType: string): boolean => {
  try {
    return (
      authorizationStatusFor(objectType as ObjectTypeIdentifier) ===
      AuthorizationStatus.sharingAuthorized
    )
  } catch {
    // 일부 타입이 버전/정의에 따라 던질 수 있으니 방어
    return false
  }
}

export interface SaveRunningProps {
  telemetries: Telemetry[]
  rawData: RawData[]
  userDashboardData: UserDashBoardData
  thumbnailUri: string | null
  runTime: number
  isPublic: boolean
  ghostRunningId?: number | null
  courseId?: number
  /** 재시도 시 HealthKit 중복 저장 방지 */
  skipHealthKit?: boolean
}

export interface SaveRunningResult {
  runningId: number
  courseId?: number
}

export class SaveRunningError extends Error {
  /** Sentry에 이미 보고되었는지 여부 */
  public tracked = false

  constructor(
    message: string,
    public readonly code:
      | "SHORT_DISTANCE"
      | "NO_RUNNING_SEGMENT"
      | "UPLOAD_FAILED"
      | "UNKNOWN"
  ) {
    super(message)
    this.name = "SaveRunningError"
  }
}

export async function saveRunning({
  telemetries,
  rawData,
  userDashboardData,
  thumbnailUri,
  runTime,
  isPublic,
  ghostRunningId,
  courseId,
  skipHealthKit = false,
}: SaveRunningProps): Promise<SaveRunningResult> {
  // 러닝 모드 결정 (실패 시 컨텍스트 전달용)
  const mode: RunSaveMode = ghostRunningId && courseId
    ? "ghost"
    : courseId
      ? "course"
      : "solo"

  const saveContext = {
    mode,
    courseId,
    ghostRunningId: ghostRunningId ?? undefined,
    telemetryCount: telemetries?.length ?? 0,
    distanceM: userDashboardData?.totalDistance ?? 0,
    durationSec: runTime,
    hasThumbnail: !!thumbnailUri,
  }

  addPhase("precheck", {
    totalTelemetry: telemetries?.length ?? 0,
    rawDataLen: rawData?.length ?? 0,
    hasUserDashboardData: !!userDashboardData,
  })
  try {
    if (!userDashboardData || userDashboardData.totalDistance < 100) {
      addWarn("short-distance-block", {
        totalDistance: userDashboardData?.totalDistance,
      })
      showCompactToast("러닝 거리가 너무 짧습니다.")
      trackRunSaveFailure(
        new SaveRunningError("러닝 거리가 너무 짧습니다.", "SHORT_DISTANCE"),
        saveContext,
        "validation"
      )
      throw new SaveRunningError("러닝 거리가 너무 짧습니다.", "SHORT_DISTANCE")
    }

    const tAlt = trackDuration("applyAltitudeBiasFromBestGPS")
    try {
      telemetries = applyAltitudeBiasFromBestGPS(telemetries, rawData)
    } catch (e) {
      // 고도 보정 실패는 핵심 데이터 처리이므로 HIGH
      captureError(
        "applyAltitudeBiasFromBestGPS",
        e,
        {
          telemetriesLen: telemetries?.length ?? 0,
          rawDataLen: rawData?.length ?? 0,
        },
        undefined,
        ERROR_PRIORITY.HIGH
      )
    } finally {
      tAlt.end()
    }

    addPhase("stabilize-pace:begin")
    const isHealthDataAvailable = await isHealthDataAvailableAsync()
    const stablePace =
      telemetries.length > 10
        ? telemetries.at(10)!.pace
        : (telemetries.at(-1)?.pace ?? 0)

    for (let i = 0; i < Math.min(10, telemetries.length); i++) {
      telemetries[i].pace = stablePace
    }
    addPhase("stabilize-pace:end", { stablePace })

    // 마지막 isRunning인 true인 값 뒤 isRunning이 false인 값을 모두 삭제
    const lastTrueIndex = telemetries.findLastIndex((t) => t.isRunning)
    if (lastTrueIndex === -1) {
      const err = new SaveRunningError(
        "러닝 데이터가 없습니다.",
        "NO_RUNNING_SEGMENT"
      )
      trackRunSaveFailure(err, saveContext, "validation")
      throw err
    }
    telemetries = telemetries.slice(0, lastTrueIndex + 1)

    const hasPaused = telemetries.some((telemetry) => !telemetry.isRunning)
    const startTime = telemetries.at(0)?.timeStamp
    const endTime = telemetries.at(-1)?.timeStamp

    const record: RunRecord = {
      distance: userDashboardData.totalDistance / 1000,
      elevationGain: userDashboardData.totalElevationGain,
      elevationLoss: userDashboardData.totalElevationLoss,
      duration: runTime,
      avgPace: userDashboardData.averagePace,
      calories: userDashboardData.totalCalories,
      avgBpm: userDashboardData.bpm === 0 ? 0 : userDashboardData.bpm,
      avgCadence: userDashboardData.averageCadence,
    }

    const tHK = trackDuration("healthkit-save")
    try {
      if (isHealthDataAvailable && !skipHealthKit) {
        const canWriteWorkout = canShare("HKWorkoutTypeIdentifier")
        const canWriteDistance = canShare(
          "HKQuantityTypeIdentifierDistanceWalkingRunning"
        )
        const canWriteEnergy = canShare(
          "HKQuantityTypeIdentifierActiveEnergyBurned"
        )
        const canWriteRoute = canShare("HKWorkoutRouteTypeIdentifier")

        Sentry.setContext("healthkitCaps", {
          isHealthDataAvailable,
          canWriteWorkout,
          canWriteDistance,
          canWriteEnergy,
          canWriteRoute,
        })

        if (!canWriteWorkout) {
          // no-op
        } else {
          const start = startTime ? new Date(startTime) : new Date()
          const end = endTime ? new Date(endTime) : new Date()

          const quantities: QuantitySampleForSaving[] = []
          if (canWriteDistance) {
            quantities.push({
              startDate: start,
              endDate: end,
              quantityType: "HKQuantityTypeIdentifierDistanceWalkingRunning",
              quantity: userDashboardData.totalDistance,
              unit: "m",
              metadata: {
                HKExternalUUID: String(Date.now()),
                source: "GhostRunner",
              },
            })
          }
          if (canWriteEnergy) {
            quantities.push({
              startDate: start,
              endDate: end,
              quantityType: "HKQuantityTypeIdentifierActiveEnergyBurned",
              quantity: userDashboardData.totalCalories,
              unit: "kcal",
              metadata: {
                HKExternalUUID: String(Date.now()),
                source: "GhostRunner",
              },
            })
          }

          if (quantities.length > 0) {
            let workout: Awaited<
              ReturnType<typeof saveWorkoutSample>
            > | null = null
            try {
              workout = await saveWorkoutSample(
                WorkoutActivityType.running,
                quantities,
                start,
                end,
                {
                  distance: userDashboardData.totalDistance,
                  energyBurned: userDashboardData.totalCalories,
                },
                {
                  HKExternalUUID: String(Date.now()),
                  source: "GhostRunner",
                }
              )
            } catch (e) {
              // HealthKit 저장 실패는 데이터 손실 가능성이므로 HIGH
              captureError(
                "healthkit:saveWorkoutSample",
                e,
                {
                  start: start.toISOString(),
                  end: end.toISOString(),
                  quantities,
                },
                undefined,
                ERROR_PRIORITY.HIGH
              )
            }

            if (workout && canWriteRoute) {
              try {
                await workout.saveWorkoutRoute(
                  rawData.map((item) => ({
                    altitude: item.altitude,
                    date: new Date(item.timestamp),
                    horizontalAccuracy: item.accuracy,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    speed: item.speed,
                    verticalAccuracy: item.altitudeAccuracy,
                    course: item.course,
                  }))
                )
              } catch (e) {
                // HealthKit 경로 저장 실패는 데이터 손실 가능성이므로 HIGH
                captureError(
                  "healthkit:saveWorkoutRoute",
                  e,
                  { routePoints: rawData.length },
                  undefined,
                  ERROR_PRIORITY.HIGH
                )
              }
            }
          }
        }
      }
    } finally {
      tHK.end({ isHealthDataAvailable })
    }

    const rawTelemetryFileUri =
      FileSystem.cacheDirectory + "rawTelemetry.jsonl"
    const interpolatedTelemetryFileUri =
      FileSystem.cacheDirectory + "interpolatedTelemetry.jsonl"

    const tFS = trackDuration("filesystem:write-jsonl")
    try {
      const rawJsonl = rawData.map((item) => JSON.stringify(item)).join("\n")
      const interpolatedJsonl = encodeTelemetries(telemetries)
        .map((item) => JSON.stringify(item))
        .join("\n")

      await FileSystem.writeAsStringAsync(rawTelemetryFileUri, rawJsonl)
      await FileSystem.writeAsStringAsync(
        interpolatedTelemetryFileUri,
        interpolatedJsonl
      )

      const [rawInfo, intInfo] = await Promise.all([
        FileSystem.getInfoAsync(rawTelemetryFileUri),
        FileSystem.getInfoAsync(interpolatedTelemetryFileUri),
      ])
      Sentry.setContext("telemetryFiles", {
        rawTelemetryFileUri,
        interpolatedTelemetryFileUri,
        rawFileInfo: rawInfo?.exists ? rawInfo.size : 0,
        interpolatedFileInfo: intInfo?.exists ? intInfo.size : 0,
        telemetriesLen: telemetries.length,
        rawDataLen: rawData.length,
      })
    } catch (e) {
      // 파일시스템 쓰기 실패는 데이터 손실이므로 HIGH
      captureError(
        "filesystem:write-jsonl",
        e,
        {
          rawTelemetryFileUri,
          interpolatedTelemetryFileUri,
          telemetriesLen: telemetries.length,
          rawDataLen: rawData.length,
        },
        undefined,
        ERROR_PRIORITY.HIGH
      )
      throw e
    } finally {
      tFS.end()
    }

    const tUpload = trackDuration("upload:post-run")
    try {
      const formData = new FormData()

      formData.append("rawTelemetry", {
        uri: rawTelemetryFileUri,
        name: "rawTelemetry.jsonl",
        type: "application/json",
      } as any)
      formData.append("interpolatedTelemetry", {
        uri: interpolatedTelemetryFileUri,
        name: "interpolatedTelemetry.jsonl",
        type: "application/json",
      } as any)
      if (thumbnailUri) {
        formData.append("screenShotImage", {
          uri: thumbnailUri,
          name: "screenShotImage.jpg",
          type: "image/jpeg",
        } as any)
      }

      const reqFileUri = FileSystem.cacheDirectory + "req.json"

      const baseReq = {
        runningName: getRunName(startTime ?? 0),
        startedAt: startTime ?? 0,
        hasPaused,
        isPublic: hasPaused ? false : isPublic,
        record,
      }

      Sentry.setContext("runMeta", {
        courseId: courseId ?? null,
        ghostRunningId: ghostRunningId ?? null,
        hasPaused,
        isPublic: hasPaused ? false : isPublic,
        startTime,
        endTime,
        duration: runTime,
        distanceM: userDashboardData.totalDistance,
        calories: userDashboardData.totalCalories,
        avgPace: userDashboardData.averagePace,
      })

      if (ghostRunningId && courseId) {
        const request: CourseGhostRunning = {
          ...baseReq,
          mode: "GHOST",
          ghostRunningId,
        }
        await FileSystem.writeAsStringAsync(
          reqFileUri,
          JSON.stringify(request)
        )
        formData.append("req", {
          uri: reqFileUri,
          name: "req.json",
          type: "application/json",
        } as any)

        const response = await withRetry(() => postCourseRun(formData, courseId))
        const runningId =
          typeof response === "number" ? response : response?.runningId
        if (typeof runningId !== "number") {
          throw new SaveRunningError(
            "서버 응답이 올바르지 않습니다.",
            "UPLOAD_FAILED"
          )
        }
        addPhase("upload:postCourseRun:success", {
          response,
          courseId,
        })
        return { runningId, courseId }
      } else if (courseId) {
        const request: CourseSoloRunning = {
          ...baseReq,
          mode: "SOLO",
          ghostRunningId: null,
        }
        await FileSystem.writeAsStringAsync(
          reqFileUri,
          JSON.stringify(request)
        )
        formData.append("req", {
          uri: reqFileUri,
          name: "req.json",
          type: "application/json",
        } as any)

        const response = await withRetry(() => postCourseRun(formData, courseId))
        const runningId =
          typeof response === "number" ? response : response?.runningId
        if (typeof runningId !== "number") {
          throw new SaveRunningError(
            "서버 응답이 올바르지 않습니다.",
            "UPLOAD_FAILED"
          )
        }
        addPhase("upload:postCourseRun:success", {
          response,
          courseId,
        })
        return { runningId, courseId }
      } else {
        const request: BaseRunning = { ...baseReq }
        await FileSystem.writeAsStringAsync(
          reqFileUri,
          JSON.stringify(request)
        )
        formData.append("req", {
          uri: reqFileUri,
          name: "req.json",
          type: "application/json",
        } as any)

        const response = await withRetry(() => postRun(formData))
        const runningId =
          typeof response === "number" ? response : response?.runningId
        if (typeof runningId !== "number") {
          throw new SaveRunningError(
            "서버 응답이 올바르지 않습니다.",
            "UPLOAD_FAILED"
          )
        }
        addPhase("upload:postRun:success", { response })
        return { runningId }
      }
    } catch (e) {
      trackRunSaveFailure(e, saveContext, "upload")
      throw e
    } finally {
      tUpload.end()
    }
  } catch (error) {
    // 이미 trackRunSaveFailure로 처리되지 않은 에러만 처리
    if (!(error instanceof SaveRunningError)) {
      trackRunSaveFailure(error, saveContext, "unknown")
    }
    throw error
  }
}
