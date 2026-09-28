import { MovementClassifier } from "@/src/features/run/filters/MovementClassifier"

const LAT_PER_M = 1 / 111320

const position = (northM: number) => ({
  latitude: 37.5 + northM * LAT_PER_M,
  longitude: 127.0,
})

describe("MovementClassifier", () => {
  let classifier: MovementClassifier

  beforeEach(() => {
    classifier = new MovementClassifier()
  })

  describe("정지 판정 (raw GPS 지터 허용)", () => {
    it("속도 0, 스텝 없음, ±1.5m 지터면 STATIONARY로 판정한다", () => {
      // raw GPS는 정지 상태에서도 1~3m 흔들림 (iOS BestForNavigation 기준)
      const jitterOffsets = [1.5, -1.5, 1.5, -1.5, 0]

      let result: string = ""
      for (const offset of jitterOffsets) {
        result = classifier.classify(0, position(offset), null)
      }

      expect(result).toBe("STATIONARY")
    })

    it("스텝 이동이 있으면 지터가 작아도 STATIONARY가 아니다", () => {
      const jitterOffsets = [0.5, -0.5, 0.5, -0.5, 0]

      let result: string = ""
      for (const offset of jitterOffsets) {
        result = classifier.classify(0, position(offset), 3)
      }

      expect(result).not.toBe("STATIONARY")
    })

    it("GPS 속도가 0이어도 위치가 일관되게 이동하면 STATIONARY가 아니다", () => {
      // 3m씩 꾸준히 북쪽 이동 (속도 신호 유실 상태의 걷기)
      const offsets = [0, 3, 6, 9, 12]

      let result: string = ""
      for (const offset of offsets) {
        result = classifier.classify(0, position(offset), null)
      }

      expect(result).not.toBe("STATIONARY")
    })
  })

  describe("걷기/달리기 구분", () => {
    it("1m/s는 WALKING으로 판정한다", () => {
      let result: string = ""
      for (let i = 0; i < 5; i++) {
        result = classifier.classify(1, position(i * 3), null)
      }
      expect(result).toBe("WALKING")
    })

    it("3m/s는 RUNNING으로 판정한다", () => {
      let result: string = ""
      for (let i = 0; i < 5; i++) {
        result = classifier.classify(3, position(i * 9), null)
      }
      expect(result).toBe("RUNNING")
    })
  })

  describe("reset", () => {
    it("reset 후 버퍼가 초기화된다", () => {
      for (let i = 0; i < 5; i++) {
        classifier.classify(3, position(i * 9), null)
      }
      classifier.reset()

      expect(classifier.getLastClassification()).toBe("STATIONARY")
    })
  })
})
