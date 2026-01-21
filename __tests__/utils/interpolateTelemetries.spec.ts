import {
  interpolateTelemetries,
  findClosest,
} from "@/src/utils/interpolateTelemetries"
import { Telemetry } from "@/src/apis/types/run"

// 테스트 헬퍼: 텔레메트리 생성
const createTelemetry = (
  timeStamp: number,
  lat = 37.5,
  lng = 127.0,
  overrides: Partial<Telemetry> = {}
): Telemetry => ({
  timeStamp,
  lat,
  lng,
  dist: 0,
  pace: 0,
  alt: 0,
  cadence: 0,
  bpm: 0,
  isRunning: true,
  ...overrides,
})

describe("interpolateTelemetries", () => {
  describe("기본 동작", () => {
    it("빈 배열에 빈 배열을 반환한다", () => {
      const result = interpolateTelemetries([])

      expect(result).toEqual([])
    })

    it("단일 요소는 그대로 반환한다", () => {
      const telemetries = [createTelemetry(1000)]

      const result = interpolateTelemetries(telemetries)

      expect(result).toHaveLength(1)
      expect(result[0].timeStamp).toBe(1000)
    })

    it("지정된 interval로 보간한다", () => {
      const telemetries = [createTelemetry(0), createTelemetry(1000)]

      const result = interpolateTelemetries(telemetries, 250)

      // 0ms에서 1000ms까지 250ms 간격 = 5개 (0, 250, 500, 750, 1000)
      expect(result).toHaveLength(5)
      expect(result[0].timeStamp).toBe(0)
      expect(result[1].timeStamp).toBe(250)
      expect(result[4].timeStamp).toBe(1000)
    })

    it("정렬되지 않은 입력을 정렬하여 처리한다", () => {
      const telemetries = [
        createTelemetry(1000),
        createTelemetry(0),
        createTelemetry(500),
      ]

      const result = interpolateTelemetries(telemetries, 250)

      // 타임스탬프가 증가하는 순서여야 함
      for (let i = 1; i < result.length; i++) {
        expect(result[i].timeStamp).toBeGreaterThan(result[i - 1].timeStamp)
      }
    })
  })

  describe("선형 보간", () => {
    it("lat/lng를 선형 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0),
        createTelemetry(1000, 37.6, 127.1),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      // 중간 지점 (500ms)에서 lat은 37.55, lng는 127.05
      const midPoint = result[1]
      expect(midPoint.lat).toBeCloseTo(37.55, 5)
      expect(midPoint.lng).toBeCloseTo(127.05, 5)
    })

    it("dist를 선형 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { dist: 0 }),
        createTelemetry(1000, 37.6, 127.1, { dist: 100 }),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].dist).toBeCloseTo(50, 5)
    })

    it("pace를 선형 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { pace: 300 }), // 5분/km
        createTelemetry(1000, 37.6, 127.1, { pace: 360 }), // 6분/km
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].pace).toBeCloseTo(330, 5) // 5분30초/km
    })

    it("alt를 선형 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { alt: 50 }),
        createTelemetry(1000, 37.6, 127.1, { alt: 100 }),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].alt).toBeCloseTo(75, 5)
    })

    it("cadence를 반올림하여 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { cadence: 170 }),
        createTelemetry(1000, 37.6, 127.1, { cadence: 180 }),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].cadence).toBe(175)
    })

    it("bpm을 반올림하여 보간한다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { bpm: 120 }),
        createTelemetry(1000, 37.6, 127.1, { bpm: 130 }),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].bpm).toBe(125)
    })

    it("isRunning은 두 값이 모두 true일 때만 true", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0, { isRunning: true }),
        createTelemetry(1000, 37.6, 127.1, { isRunning: false }),
      ]

      const result = interpolateTelemetries(telemetries, 500)

      expect(result[1].isRunning).toBe(false)
    })
  })

  describe("배속 처리", () => {
    it("2배속에서 절반 시간에 끝난다", () => {
      const telemetries = [
        createTelemetry(0),
        createTelemetry(1000),
      ]

      const result = interpolateTelemetries(telemetries, 250, 2)

      // 원본 1초 → 2배속이면 0.5초 = 500ms
      // 0, 250, 500 = 3개
      expect(result.length).toBeLessThan(5)
      expect(result[result.length - 1].timeStamp).toBe(500)
    })

    it("0.5배속에서 두 배 시간이 걸린다", () => {
      const telemetries = [
        createTelemetry(0),
        createTelemetry(1000),
      ]

      const result = interpolateTelemetries(telemetries, 250, 0.5)

      // 원본 1초 → 0.5배속이면 2초 = 2000ms
      expect(result[result.length - 1].timeStamp).toBe(2000)
    })

    it("배속에서도 좌표가 올바르게 매핑된다", () => {
      const telemetries = [
        createTelemetry(0, 37.5, 127.0),
        createTelemetry(1000, 37.6, 127.1),
      ]

      const result = interpolateTelemetries(telemetries, 250, 2)

      // 2배속에서 250ms는 실제 500ms 지점
      expect(result[1].lat).toBeCloseTo(37.55, 5)
      expect(result[1].lng).toBeCloseTo(127.05, 5)
    })
  })

  describe("엣지 케이스", () => {
    it("동일한 타임스탬프를 가진 텔레메트리 처리", () => {
      const telemetries = [
        createTelemetry(1000, 37.5, 127.0),
        createTelemetry(1000, 37.6, 127.1), // 같은 타임스탬프
      ]

      const result = interpolateTelemetries(telemetries, 250)

      expect(result.length).toBeGreaterThan(0)
    })

    it("정확히 interval에 맞는 타임스탬프 처리", () => {
      const telemetries = [
        createTelemetry(0),
        createTelemetry(250),
        createTelemetry(500),
      ]

      const result = interpolateTelemetries(telemetries, 250)

      expect(result[0].timeStamp).toBe(0)
      expect(result[1].timeStamp).toBe(250)
      expect(result[2].timeStamp).toBe(500)
    })

    it("긴 시간 간격의 텔레메트리 처리", () => {
      const telemetries = [
        createTelemetry(0),
        createTelemetry(10000), // 10초 간격
      ]

      const result = interpolateTelemetries(telemetries, 1000)

      expect(result).toHaveLength(11) // 0 ~ 10000, 1초 간격
    })
  })
})

describe("findClosest", () => {
  interface TimedRecord {
    timestamp: number
    value: string
  }

  const createRecord = (timestamp: number, value: string): TimedRecord => ({
    timestamp,
    value,
  })

  describe("기본 동작", () => {
    it("빈 배열에서 undefined를 반환한다", () => {
      const result = findClosest<TimedRecord>([], 1000)

      expect(result).toBeUndefined()
    })

    it("단일 요소를 반환한다", () => {
      const records = [createRecord(1000, "a")]

      const result = findClosest(records, 500)

      expect(result?.value).toBe("a")
    })

    it("정확히 일치하는 요소를 찾는다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
        createRecord(3000, "c"),
      ]

      const result = findClosest(records, 2000)

      expect(result?.value).toBe("b")
    })
  })

  describe("이진 탐색", () => {
    it("target보다 작은 값 중 가장 가까운 것을 찾는다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
        createRecord(3000, "c"),
      ]

      const result = findClosest(records, 1800)

      expect(result?.value).toBe("b") // 2000이 1800에 가장 가까움
    })

    it("target보다 큰 값 중 가장 가까운 것을 찾는다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
        createRecord(3000, "c"),
      ]

      const result = findClosest(records, 2200)

      expect(result?.value).toBe("b") // 2000이 2200에 가장 가까움
    })

    it("동일한 거리일 때 이전 값을 선호한다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
        createRecord(3000, "c"),
      ]

      const result = findClosest(records, 1500) // 1000과 2000 모두 500 거리

      expect(result?.value).toBe("a")
    })

    it("target이 범위 밖(앞)일 때 첫 번째 요소를 반환한다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
      ]

      const result = findClosest(records, 500)

      expect(result?.value).toBe("a")
    })

    it("target이 범위 밖(뒤)일 때 마지막 요소를 반환한다", () => {
      const records = [
        createRecord(1000, "a"),
        createRecord(2000, "b"),
      ]

      const result = findClosest(records, 3000)

      expect(result?.value).toBe("b")
    })
  })

  describe("커스텀 getTime 함수", () => {
    it("커스텀 시간 접근자를 사용한다", () => {
      interface CustomRecord {
        ts: number
        name: string
      }

      const records: CustomRecord[] = [
        { ts: 1000, name: "a" },
        { ts: 2000, name: "b" },
        { ts: 3000, name: "c" },
      ]

      const result = findClosest(records, 1800, (r) => r.ts)

      expect(result?.name).toBe("b")
    })
  })

  describe("성능", () => {
    it("많은 요소에서 효율적으로 탐색한다", () => {
      const records = Array.from({ length: 10000 }, (_, i) =>
        createRecord(i * 100, `item${i}`)
      )

      const startTime = Date.now()
      const result = findClosest(records, 550000) // 중간 어딘가
      const elapsed = Date.now() - startTime

      expect(result?.value).toBe("item5500")
      expect(elapsed).toBeLessThan(10) // 10ms 이내
    })
  })
})
