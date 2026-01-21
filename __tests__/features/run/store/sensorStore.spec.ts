import { SensorStore } from "@/src/features/run/store/sensorStore"
import { LocationObject } from "expo-location"
import { BarometerMeasurement } from "expo-sensors"

// 테스트 헬퍼: LocationObject 생성
const createLocationObject = (
  lat: number,
  lng: number,
  timestamp: number
): LocationObject => ({
  coords: {
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    altitude: 50,
    altitudeAccuracy: 5,
    speed: 3,
    heading: 90,
  },
  timestamp,
})

// 테스트 헬퍼: BarometerMeasurement 생성
const createBarometerMeasurement = (
  pressure: number,
  timestamp: number
): BarometerMeasurement => ({
  pressure,
  timestamp,
  relativeAltitude: 0,
})

// 테스트 헬퍼: PedometerResult 생성
const createPedometerResult = (steps: number, timestamp: number) => ({
  steps,
  timestamp,
})

// 테스트 헬퍼: HeartRateSample 생성
const createHeartRateSample = (bpm: number, timestamp: number) => ({
  bpm,
  timestamp,
})

describe("SensorStore", () => {
  let store: SensorStore

  beforeEach(() => {
    store = new SensorStore()
  })

  describe("pushLocation", () => {
    it("LocationObject를 LocationSample로 변환하여 저장한다", () => {
      const raw = createLocationObject(37.5, 127.0, 1000)

      const sample = store.pushLocation(raw)

      expect(sample.latitude).toBe(37.5)
      expect(sample.longitude).toBe(127.0)
      expect(sample.accuracy).toBe(10)
      expect(sample.altitude).toBe(50)
      expect(sample.altitudeAccuracy).toBe(5)
      expect(sample.speed).toBe(3)
      expect(sample.course).toBe(90) // heading → course
      expect(sample.timestamp).toBe(1000)
    })

    it("locations 버퍼에 추가한다", () => {
      store.pushLocation(createLocationObject(37.5, 127.0, 1000))
      store.pushLocation(createLocationObject(37.501, 127.001, 2000))

      const last = store.locations.last()
      expect(last?.latitude).toBe(37.501)
    })

    it("변환된 sample을 반환한다", () => {
      const raw = createLocationObject(37.5, 127.0, 1000)

      const sample = store.pushLocation(raw)

      expect(sample).toHaveProperty("latitude")
      expect(sample).toHaveProperty("longitude")
      expect(sample).toHaveProperty("timestamp")
    })
  })

  describe("pushPressure", () => {
    it("BarometerMeasurement를 PressureSample로 변환하여 저장한다", () => {
      const raw = createBarometerMeasurement(1013.25, 1000)

      const sample = store.pushPressure(raw)

      expect(sample.pressure).toBe(1013.25)
      expect(sample.timestamp).toBe(1000)
    })

    it("pressures 버퍼에 추가한다", () => {
      store.pushPressure(createBarometerMeasurement(1013, 1000))
      store.pushPressure(createBarometerMeasurement(1014, 2000))

      const last = store.pressures.last()
      expect(last?.pressure).toBe(1014)
    })
  })

  describe("pushSteps", () => {
    it("PedometerResult를 StepSample로 변환하여 저장한다", () => {
      const raw = createPedometerResult(100, 1000)

      const sample = store.pushSteps(raw)

      expect(sample.totalSteps).toBe(100)
      expect(sample.timestamp).toBe(1000)
    })

    it("steps 버퍼에 추가한다", () => {
      store.pushSteps(createPedometerResult(100, 1000))
      store.pushSteps(createPedometerResult(150, 2000))

      const last = store.steps.last()
      expect(last?.totalSteps).toBe(150)
    })
  })

  describe("pushHeartRate", () => {
    it("HeartRateSample을 저장한다", () => {
      const raw = createHeartRateSample(120, 1000)

      const sample = store.pushHeartRate(raw)

      expect(sample.bpm).toBe(120)
      expect(sample.timestamp).toBe(1000)
    })

    it("heartRates 버퍼에 추가한다", () => {
      store.pushHeartRate(createHeartRateSample(120, 1000))
      store.pushHeartRate(createHeartRateSample(125, 2000))

      const last = store.heartRates.last()
      expect(last?.bpm).toBe(125)
    })
  })

  describe("reset", () => {
    it("모든 버퍼를 초기화한다", () => {
      store.pushLocation(createLocationObject(37.5, 127.0, 1000))
      store.pushPressure(createBarometerMeasurement(1013, 1000))
      store.pushSteps(createPedometerResult(100, 1000))
      store.pushHeartRate(createHeartRateSample(120, 1000))

      store.reset()

      expect(store.locations.last()).toBeUndefined()
      expect(store.pressures.last()).toBeUndefined()
      expect(store.steps.last()).toBeUndefined()
      expect(store.heartRates.last()).toBeUndefined()
    })
  })

  describe("RingBuffer 동작", () => {
    it("버퍼 제한을 초과하면 오래된 데이터가 제거된다", () => {
      // locations 버퍼 크기 테스트 (LOCATION_BUFFER_SIZE)
      for (let i = 0; i < 150; i++) {
        store.pushLocation(createLocationObject(37.5, 127.0, i * 1000))
      }

      // 가장 오래된 데이터(timestamp=0)는 제거되어야 함
      const oldest = store.locations.closest(0, 100)
      expect(oldest).toBeUndefined()
    })

    it("closest로 가장 가까운 타임스탬프의 데이터를 찾는다", () => {
      store.pushPressure(createBarometerMeasurement(1010, 1000))
      store.pushPressure(createBarometerMeasurement(1013, 2000))
      store.pushPressure(createBarometerMeasurement(1015, 3000))

      const closest = store.pressures.closest(2200, 500)

      expect(closest?.pressure).toBe(1013)
    })
  })

  describe("타임스탬프 정규화 (ensureTs)", () => {
    it("유효한 타임스탬프를 그대로 사용한다", () => {
      const raw = createLocationObject(37.5, 127.0, 1234567890)

      const sample = store.pushLocation(raw)

      expect(sample.timestamp).toBe(1234567890)
    })

    it("null/undefined 타임스탬프는 현재 시간으로 대체한다", () => {
      const now = Date.now()
      const raw = {
        coords: {
          latitude: 37.5,
          longitude: 127.0,
          accuracy: 10,
          altitude: 50,
          altitudeAccuracy: 5,
          speed: 3,
          heading: 90,
        },
        timestamp: null as any,
      }

      const sample = store.pushLocation(raw)

      expect(sample.timestamp).toBeGreaterThanOrEqual(now)
    })
  })

  describe("독립적인 버퍼 관리", () => {
    it("각 버퍼는 독립적으로 동작한다", () => {
      store.pushLocation(createLocationObject(37.5, 127.0, 1000))
      store.pushPressure(createBarometerMeasurement(1013, 2000))

      expect(store.locations.last()?.timestamp).toBe(1000)
      expect(store.pressures.last()?.timestamp).toBe(2000)
      expect(store.steps.last()).toBeUndefined()
      expect(store.heartRates.last()).toBeUndefined()
    })
  })
})
