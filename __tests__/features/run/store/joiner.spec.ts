import { StreamJoiner, JoinedSample } from "@/src/features/run/store/joiner"
import { SensorStore } from "@/src/features/run/store/sensorStore"
import {
  LocationSample,
  PressureSample,
  StepSample,
  HeartRateSample,
} from "@/src/features/run/store/sensorTypes"

// 테스트 헬퍼: LocationSample 생성
const createLocationSample = (timestamp: number, lat = 37.5, lng = 127.0): LocationSample => ({
  latitude: lat,
  longitude: lng,
  accuracy: 10,
  altitude: 50,
  altitudeAccuracy: 5,
  speed: 3,
  course: 90,
  timestamp,
})

// 테스트 헬퍼: PressureSample 생성
const createPressureSample = (timestamp: number, pressure = 1013): PressureSample => ({
  pressure,
  timestamp,
})

// 테스트 헬퍼: StepSample 생성
const createStepSample = (timestamp: number, totalSteps = 100): StepSample => ({
  totalSteps,
  timestamp,
})

// 테스트 헬퍼: HeartRateSample 생성
const createHeartRateSample = (timestamp: number, bpm = 120): HeartRateSample => ({
  bpm,
  timestamp,
})

describe("StreamJoiner", () => {
  let store: SensorStore
  let joiner: StreamJoiner

  beforeEach(() => {
    store = new SensorStore()
    joiner = new StreamJoiner(store, 3000) // 3초 윈도우
  })

  describe("기본 동작", () => {
    it("location과 함께 타임스탬프를 반환한다", () => {
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.timestamp).toBe(5000)
      expect(result.location).toEqual(location)
    })

    it("매칭되는 센서 데이터가 없으면 undefined를 반환한다", () => {
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.pressure).toBeUndefined()
      expect(result.steps).toBeUndefined()
      expect(result.heartRate).toBeUndefined()
    })
  })

  describe("센서 데이터 매칭", () => {
    it("윈도우 내의 pressure 데이터를 매칭한다", () => {
      store.pressures.push(createPressureSample(4000, 1013))
      store.pressures.push(createPressureSample(5000, 1014))
      const location = createLocationSample(5100)

      const result = joiner.onNewLocation(location)

      expect(result.pressure).toBeDefined()
      expect(result.pressure?.pressure).toBe(1014)
    })

    it("윈도우 내의 steps 데이터를 매칭한다", () => {
      store.steps.push(createStepSample(4500, 100))
      store.steps.push(createStepSample(5200, 105))
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.steps).toBeDefined()
      // 5000에 가장 가까운 것은 4500 또는 5200
      expect(result.steps?.totalSteps).toBeGreaterThanOrEqual(100)
    })

    it("윈도우 내의 heartRate 데이터를 매칭한다", () => {
      store.heartRates.push(createHeartRateSample(4800, 118))
      store.heartRates.push(createHeartRateSample(5100, 122))
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.heartRate).toBeDefined()
    })

    it("모든 센서 데이터를 동시에 매칭한다", () => {
      store.pressures.push(createPressureSample(5000, 1013))
      store.steps.push(createStepSample(5000, 200))
      store.heartRates.push(createHeartRateSample(5000, 130))
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.pressure?.pressure).toBe(1013)
      expect(result.steps?.totalSteps).toBe(200)
      expect(result.heartRate?.bpm).toBe(130)
    })
  })

  describe("윈도우 경계", () => {
    it("윈도우 밖의 데이터는 매칭하지 않는다", () => {
      store.pressures.push(createPressureSample(1000, 1013)) // 5초 전
      const location = createLocationSample(5000) // 3초 윈도우

      const result = joiner.onNewLocation(location)

      expect(result.pressure).toBeUndefined()
    })

    it("정확히 윈도우 경계에 있는 데이터를 매칭한다", () => {
      store.pressures.push(createPressureSample(2000, 1013)) // 정확히 3초 전
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.pressure?.pressure).toBe(1013)
    })

    it("윈도우 경계 바로 밖의 데이터는 매칭하지 않는다", () => {
      store.pressures.push(createPressureSample(1999, 1013)) // 3001ms 전
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.pressure).toBeUndefined()
    })
  })

  describe("가장 가까운 데이터 선택", () => {
    it("여러 데이터 중 가장 가까운 것을 선택한다", () => {
      store.pressures.push(createPressureSample(4000, 1010))
      store.pressures.push(createPressureSample(4800, 1013))
      store.pressures.push(createPressureSample(5500, 1015))
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      // 5000에 가장 가까운 것은 4800 (200ms 차이)
      expect(result.pressure?.pressure).toBe(1013)
    })

    it("미래 데이터도 매칭할 수 있다", () => {
      store.pressures.push(createPressureSample(5500, 1015))
      const location = createLocationSample(5000)

      const result = joiner.onNewLocation(location)

      expect(result.pressure?.pressure).toBe(1015)
    })
  })

  describe("커스텀 윈도우 크기", () => {
    it("작은 윈도우 크기로 더 엄격하게 매칭한다", () => {
      const strictJoiner = new StreamJoiner(store, 500) // 0.5초 윈도우
      store.pressures.push(createPressureSample(4000, 1013))
      const location = createLocationSample(5000)

      const result = strictJoiner.onNewLocation(location)

      expect(result.pressure).toBeUndefined() // 1초 차이는 0.5초 윈도우 밖
    })

    it("큰 윈도우 크기로 더 느슨하게 매칭한다", () => {
      const looseJoiner = new StreamJoiner(store, 10000) // 10초 윈도우
      store.pressures.push(createPressureSample(1000, 1013))
      const location = createLocationSample(5000)

      const result = looseJoiner.onNewLocation(location)

      expect(result.pressure?.pressure).toBe(1013)
    })
  })

  describe("연속적인 데이터 처리", () => {
    it("연속적인 location 이벤트를 처리한다", () => {
      // 센서 데이터 추가
      store.pressures.push(createPressureSample(1000, 1010))
      store.pressures.push(createPressureSample(2000, 1011))
      store.pressures.push(createPressureSample(3000, 1012))
      store.pressures.push(createPressureSample(4000, 1013))
      store.pressures.push(createPressureSample(5000, 1014))

      // 연속적인 location 처리
      const result1 = joiner.onNewLocation(createLocationSample(1500))
      const result2 = joiner.onNewLocation(createLocationSample(2500))
      const result3 = joiner.onNewLocation(createLocationSample(3500))

      expect(result1.pressure?.pressure).toBe(1010)
      expect(result2.pressure?.pressure).toBe(1011)
      expect(result3.pressure?.pressure).toBe(1012)
    })
  })

  describe("JoinedSample 인터페이스", () => {
    it("올바른 타입의 JoinedSample을 반환한다", () => {
      store.pressures.push(createPressureSample(5000, 1013))
      store.steps.push(createStepSample(5000, 100))
      store.heartRates.push(createHeartRateSample(5000, 120))
      const location = createLocationSample(5000)

      const result: JoinedSample = joiner.onNewLocation(location)

      expect(result).toHaveProperty("timestamp")
      expect(result).toHaveProperty("location")
      expect(result).toHaveProperty("pressure")
      expect(result).toHaveProperty("steps")
      expect(result).toHaveProperty("heartRate")
    })
  })
})
