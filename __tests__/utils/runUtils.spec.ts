import {
  getRunTime,
  getPace,
  getFormattedPace,
  getCalories,
  getCadence,
  getRunName,
  getDate,
  telemetriesToSegment,
  checkPointSynced,
  findClosestPointIndex,
  getTelemetriesWithoutLastFalse,
} from "@/src/utils/runUtils"
import type { Telemetry } from "@/src/apis/types/run"

describe("runUtils", () => {
  describe("getRunTime", () => {
    describe("기본 포맷 (HH:MM:SS_IF_HH_EXISTS)", () => {
      it("1시간 미만일 때 MM:SS 형식 반환", () => {
        expect(getRunTime(0)).toBe("00:00")
        expect(getRunTime(59)).toBe("00:59")
        expect(getRunTime(60)).toBe("01:00")
        expect(getRunTime(125)).toBe("02:05")
        expect(getRunTime(3599)).toBe("59:59")
      })

      it("1시간 이상일 때 HH:MM:SS 형식 반환", () => {
        expect(getRunTime(3600)).toBe("01:00:00")
        expect(getRunTime(3661)).toBe("01:01:01")
        expect(getRunTime(7325)).toBe("02:02:05")
        expect(getRunTime(36000)).toBe("10:00:00")
      })

      it("음수 시간 처리 (- 접두사)", () => {
        expect(getRunTime(-60)).toBe("-01:00")
        expect(getRunTime(-3661)).toBe("-01:01:01")
      })
    })

    describe("HH:MM:SS 포맷 (강제)", () => {
      it("1시간 미만도 HH:MM:SS 형식 반환", () => {
        expect(getRunTime(0, "HH:MM:SS")).toBe("00:00:00")
        expect(getRunTime(59, "HH:MM:SS")).toBe("00:00:59")
        expect(getRunTime(125, "HH:MM:SS")).toBe("00:02:05")
      })
    })

    describe("MM:SS 포맷 (강제)", () => {
      it("1시간 이상도 MM:SS 형식 반환 (분이 60 이상)", () => {
        expect(getRunTime(3600, "MM:SS")).toBe("60:00")
        expect(getRunTime(3661, "MM:SS")).toBe("61:01")
        expect(getRunTime(7325, "MM:SS")).toBe("122:05")
      })
    })
  })

  describe("getPace", () => {
    it("거리와 시간으로 페이스 계산 (초/km)", () => {
      // 1km를 5분(300초)에 달리면 페이스 = 300초/km
      expect(getPace(300, 1000)).toBe(300)
    })

    it("3km를 15분(900초)에 달리면 페이스 = 300초/km", () => {
      expect(getPace(900, 3000)).toBe(300)
    })

    it("5km를 30분(1800초)에 달리면 페이스 = 360초/km", () => {
      expect(getPace(1800, 5000)).toBe(360)
    })

    it("소수점 2자리까지 반올림", () => {
      // 1km를 7분(420초)에 달리면 정확히 420
      expect(getPace(420, 1000)).toBe(420)
      // 1km를 7분10초(430초)에 달리면 430
      expect(getPace(430, 1000)).toBe(430)
    })

    it("거리가 0일 때 0 반환", () => {
      expect(getPace(300, 0)).toBe(0)
    })

    it("시간이 0일 때 0 반환", () => {
      expect(getPace(0, 1000)).toBe(0)
    })

    it("거리가 음수일 때 0 반환", () => {
      expect(getPace(300, -1000)).toBe(0)
    })
  })

  describe("getFormattedPace", () => {
    // 함수가 사용하는 특수 문자:
    // - right single quotation mark (U+2019): '
    // - right double quotation mark (U+201D): "
    const RSQM = "\u2019"
    const RDQM = "\u201D"

    it("페이스를 M'SS\" 형식으로 변환", () => {
      expect(getFormattedPace(300)).toBe(`5${RSQM}00${RDQM}`)
      expect(getFormattedPace(330)).toBe(`5${RSQM}30${RDQM}`)
      expect(getFormattedPace(361)).toBe(`6${RSQM}01${RDQM}`)
      expect(getFormattedPace(420)).toBe(`7${RSQM}00${RDQM}`)
    })

    it("초가 한 자리수일 때 0으로 패딩", () => {
      expect(getFormattedPace(301)).toBe(`5${RSQM}01${RDQM}`)
      expect(getFormattedPace(309)).toBe(`5${RSQM}09${RDQM}`)
    })

    it("10분 이상 페이스 처리", () => {
      expect(getFormattedPace(600)).toBe(`10${RSQM}00${RDQM}`)
      expect(getFormattedPace(725)).toBe(`12${RSQM}05${RDQM}`)
    })
  })

  describe("getCalories", () => {
    const weight = 70 // 70kg 기준

    it("거리 기반 칼로리 계산 (MET 기반)", () => {
      // 속도 < 6.4 km/h → MET = 4.5
      // 1km를 10분(600초)에 → 6 km/h → MET = 4.5
      // calories = MET * weight * hours = 4.5 * 70 * (600/3600) = 52.5 → 53 (반올림)
      expect(getCalories({ distance: 1000, timeInSec: 600, weight: 70 })).toBe(
        53
      )
    })

    it("속도 6.4-8 km/h → MET = 7", () => {
      // 1km를 8분(480초)에 → 7.5 km/h → MET = 7
      // calories = 7 * 70 * (480/3600) = 65.33 → 65
      expect(getCalories({ distance: 1000, timeInSec: 480, weight: 70 })).toBe(
        65
      )
    })

    it("속도 8-9.7 km/h → MET = 9", () => {
      // 1km를 7분(420초)에 → 약 8.57 km/h → MET = 9
      // calories = 9 * 70 * (420/3600) = 73.5 → 74
      expect(getCalories({ distance: 1000, timeInSec: 420, weight: 70 })).toBe(
        74
      )
    })

    it("속도 9.7-11.3 km/h → MET = 11", () => {
      // 1km를 6분(360초)에 → 10 km/h → MET = 11
      // calories = 11 * 70 * (360/3600) = 77
      expect(getCalories({ distance: 1000, timeInSec: 360, weight: 70 })).toBe(
        77
      )
    })

    it("속도 > 11.3 km/h → MET = 13.5", () => {
      // 1km를 5분(300초)에 → 12 km/h → MET = 13.5
      // calories = 13.5 * 70 * (300/3600) = 78.75 → 79
      expect(getCalories({ distance: 1000, timeInSec: 300, weight: 70 })).toBe(
        79
      )
    })

    it("거리가 0일 때 0 반환", () => {
      expect(getCalories({ distance: 0, timeInSec: 600, weight: 70 })).toBe(0)
    })

    it("시간이 0일 때 0 반환", () => {
      expect(getCalories({ distance: 1000, timeInSec: 0, weight: 70 })).toBe(0)
    })

    it("체중이 0일 때 0 반환", () => {
      expect(getCalories({ distance: 1000, timeInSec: 600, weight: 0 })).toBe(0)
    })
  })

  describe("getCadence", () => {
    it("걸음수와 시간으로 케이던스 계산 (걸음/분)", () => {
      // 600걸음을 5분(300초)에 → 600/5 = 120 걸음/분
      expect(getCadence(600, 300)).toBe(120)
    })

    it("1800걸음을 10분(600초)에 → 180 걸음/분", () => {
      expect(getCadence(1800, 600)).toBe(180)
    })

    it("결과를 정수로 반올림", () => {
      // 100걸음을 60초에 → 100 걸음/분
      expect(getCadence(100, 60)).toBe(100)
      // 101걸음을 60초에 → 101 걸음/분
      expect(getCadence(101, 60)).toBe(101)
    })

    it("시간이 0일 때 0 반환", () => {
      expect(getCadence(600, 0)).toBe(0)
    })

    it("걸음수가 0일 때 0 반환", () => {
      expect(getCadence(0, 300)).toBe(0)
    })
  })

  describe("getRunName", () => {
    it("요일과 시간대로 러닝 이름 생성", () => {
      // 2024년 1월 15일 월요일 오전 7시
      const mondayMorning = new Date(2024, 0, 15, 7, 0, 0).getTime()
      expect(getRunName(mondayMorning)).toBe("월요일 아침 러닝")
    })

    it("새벽 시간대 (0-6시)", () => {
      const dawn = new Date(2024, 0, 15, 5, 0, 0).getTime()
      expect(getRunName(dawn)).toBe("월요일 새벽 러닝")
    })

    it("아침 시간대 (6-12시)", () => {
      const morning = new Date(2024, 0, 15, 10, 0, 0).getTime()
      expect(getRunName(morning)).toBe("월요일 아침 러닝")
    })

    it("오후 시간대 (12-17시)", () => {
      const afternoon = new Date(2024, 0, 15, 15, 0, 0).getTime()
      expect(getRunName(afternoon)).toBe("월요일 오후 러닝")
    })

    it("저녁 시간대 (17-21시)", () => {
      const evening = new Date(2024, 0, 15, 19, 0, 0).getTime()
      expect(getRunName(evening)).toBe("월요일 저녁 러닝")
    })

    it("야간 시간대 (21-24시)", () => {
      const night = new Date(2024, 0, 15, 22, 0, 0).getTime()
      expect(getRunName(night)).toBe("월요일 야간 러닝")
    })

    it("다른 요일 처리", () => {
      const sunday = new Date(2024, 0, 14, 10, 0, 0).getTime() // 일요일
      expect(getRunName(sunday)).toBe("일요일 아침 러닝")

      const wednesday = new Date(2024, 0, 17, 15, 0, 0).getTime() // 수요일
      expect(getRunName(wednesday)).toBe("수요일 오후 러닝")
    })
  })

  describe("getDate", () => {
    it("타임스탬프를 YYYY.MM.DD 형식으로 변환", () => {
      const date = new Date(2024, 0, 15).getTime() // 2024년 1월 15일
      expect(getDate(date)).toBe("2024.01.15")
    })

    it("한 자리 월/일에 0 패딩", () => {
      const date = new Date(2024, 5, 5).getTime() // 2024년 6월 5일
      expect(getDate(date)).toBe("2024.06.05")
    })

    it("연말 날짜 처리", () => {
      const date = new Date(2024, 11, 31).getTime() // 2024년 12월 31일
      expect(getDate(date)).toBe("2024.12.31")
    })
  })

  describe("telemetriesToSegment", () => {
    const mockTelemetries: Telemetry[] = [
      {
        timeStamp: 1000,
        lat: 37.5,
        lng: 127.0,
        dist: 0,
        pace: 300,
        alt: 10,
        cadence: 180,
        bpm: 150,
        isRunning: true,
      },
      {
        timeStamp: 2000,
        lat: 37.501,
        lng: 127.001,
        dist: 100,
        pace: 300,
        alt: 11,
        cadence: 180,
        bpm: 152,
        isRunning: true,
      },
      {
        timeStamp: 3000,
        lat: 37.502,
        lng: 127.002,
        dist: 200,
        pace: 300,
        alt: 12,
        cadence: 180,
        bpm: 155,
        isRunning: true,
      },
      {
        timeStamp: 4000,
        lat: 37.503,
        lng: 127.003,
        dist: 300,
        pace: 300,
        alt: 13,
        cadence: 180,
        bpm: 158,
        isRunning: true,
      },
    ]

    it("progress 위치에서 run/rest 세그먼트 분리", () => {
      const segments = telemetriesToSegment(mockTelemetries, 2)

      expect(segments).toHaveLength(2)

      // 첫 번째 세그먼트 (달린 구간)
      expect(segments[0].isRunning).toBe(true)
      expect(segments[0].points).toHaveLength(3) // 0, 1, 2 인덱스

      // 두 번째 세그먼트 (남은 구간)
      expect(segments[1].isRunning).toBe(false)
      expect(segments[1].points).toHaveLength(2) // 2, 3 인덱스 (2부터 시작)
    })

    it("progress가 0일 때", () => {
      const segments = telemetriesToSegment(mockTelemetries, 0)

      expect(segments[0].points).toHaveLength(1) // 첫 번째 포인트만
      expect(segments[1].points).toHaveLength(4) // 나머지 전체
    })

    it("progress가 마지막 인덱스일 때", () => {
      const segments = telemetriesToSegment(mockTelemetries, 3)

      expect(segments[0].points).toHaveLength(4) // 전체
      expect(segments[1].points).toHaveLength(1) // 마지막만
    })

    it("progress가 배열 길이 이상일 때", () => {
      const segments = telemetriesToSegment(mockTelemetries, 10)

      expect(segments[0].points).toHaveLength(4) // 전체
      expect(segments[1].points).toHaveLength(0) // 빈 배열
    })

    it("좌표 변환 확인 (lat/lng → latitude/longitude)", () => {
      const segments = telemetriesToSegment(mockTelemetries, 1)

      expect(segments[0].points[0]).toEqual({
        latitude: 37.5,
        longitude: 127.0,
      })
    })
  })

  describe("getTelemetriesWithoutLastFalse", () => {
    it("마지막 isRunning=true 이후의 false 제거", () => {
      const telemetries: Telemetry[] = [
        createTelemetry({ isRunning: true }),
        createTelemetry({ isRunning: true }),
        createTelemetry({ isRunning: false }), // 마지막 true 이후
        createTelemetry({ isRunning: false }), // 제거됨
      ]

      const result = getTelemetriesWithoutLastFalse(telemetries)

      expect(result).toHaveLength(2)
      expect(result.every((t) => t.isRunning)).toBe(true)
    })

    it("중간에 false가 있어도 마지막 true 이후만 제거", () => {
      const telemetries: Telemetry[] = [
        createTelemetry({ isRunning: true }),
        createTelemetry({ isRunning: false }), // 중간 정지
        createTelemetry({ isRunning: true }), // 마지막 true
        createTelemetry({ isRunning: false }), // 제거됨
      ]

      const result = getTelemetriesWithoutLastFalse(telemetries)

      expect(result).toHaveLength(3)
      expect(result[1].isRunning).toBe(false) // 중간 정지는 유지
      expect(result[2].isRunning).toBe(true)
    })

    it("모든 telemetry가 isRunning=true일 때 그대로 반환", () => {
      const telemetries: Telemetry[] = [
        createTelemetry({ isRunning: true }),
        createTelemetry({ isRunning: true }),
        createTelemetry({ isRunning: true }),
      ]

      const result = getTelemetriesWithoutLastFalse(telemetries)

      expect(result).toHaveLength(3)
    })

    it("빈 배열 처리", () => {
      const result = getTelemetriesWithoutLastFalse([])

      expect(result).toHaveLength(0)
    })
  })

  describe("checkPointSynced", () => {
    it("두 좌표가 acceptanceDistance 내에 있으면 true", () => {
      const target = { lat: 37.5, lng: 127.0 }
      const current = { lat: 37.5001, lng: 127.0001 } // 약 15m 거리

      expect(checkPointSynced(target, current, 50)).toBe(true)
    })

    it("두 좌표가 acceptanceDistance 밖이면 false", () => {
      const target = { lat: 37.5, lng: 127.0 }
      const current = { lat: 37.51, lng: 127.01 } // 약 1.4km 거리

      expect(checkPointSynced(target, current, 50)).toBe(false)
    })

    it("같은 좌표면 true", () => {
      const point = { lat: 37.5, lng: 127.0 }

      expect(checkPointSynced(point, point, 1)).toBe(true)
    })
  })

  describe("findClosestPointIndex", () => {
    const telemetries: Telemetry[] = [
      createTelemetry({ lat: 37.5, lng: 127.0 }),
      createTelemetry({ lat: 37.501, lng: 127.001 }), // 약 140m
      createTelemetry({ lat: 37.502, lng: 127.002 }), // 약 280m
      createTelemetry({ lat: 37.503, lng: 127.003 }), // 약 420m
    ]

    it("acceptanceDistance 내의 첫 번째 인덱스 반환", () => {
      const current = { lat: 37.5001, lng: 127.0001 }

      expect(findClosestPointIndex(current, telemetries, 50)).toBe(0)
    })

    it("중간 지점 찾기", () => {
      // (37.501, 127.001)에서 약 10m 떨어진 좌표
      const current = { lat: 37.5011, lng: 127.0011 }

      expect(findClosestPointIndex(current, telemetries, 50)).toBe(1)
    })

    it("매칭되는 포인트가 없으면 -1 반환", () => {
      const current = { lat: 38.0, lng: 128.0 } // 멀리 떨어진 좌표

      expect(findClosestPointIndex(current, telemetries, 50)).toBe(-1)
    })
  })
})

// 테스트용 헬퍼 함수
function createTelemetry(
  overrides: Partial<Telemetry> & { isRunning?: boolean }
): Telemetry {
  return {
    timeStamp: Date.now(),
    lat: 37.5,
    lng: 127.0,
    dist: 0,
    pace: 300,
    alt: 10,
    cadence: 180,
    bpm: 150,
    isRunning: true,
    ...overrides,
  }
}
