import { RingBuffer } from "@/src/features/run/store/ringBuffers"

interface TestItem {
  timestamp: number
  value: string
}

const createItem = (timestamp: number, value: string): TestItem => ({
  timestamp,
  value,
})

describe("RingBuffer", () => {
  describe("기본 동작", () => {
    it("아이템을 추가할 수 있다", () => {
      const buffer = new RingBuffer<TestItem>(5)

      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))

      expect(buffer.last()).toEqual(createItem(2000, "b"))
    })

    it("limit 개수만큼만 유지한다", () => {
      const buffer = new RingBuffer<TestItem>(3)

      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))
      buffer.push(createItem(3000, "c"))
      buffer.push(createItem(4000, "d")) // 첫 번째 아이템이 제거됨

      // "a"는 제거되고 "b", "c", "d"만 남아있어야 함
      expect(buffer.closest(1000, 100)).toBeUndefined()
      expect(buffer.closest(2000, 100)?.value).toBe("b")
    })

    it("빈 버퍼에서 last()는 undefined를 반환한다", () => {
      const buffer = new RingBuffer<TestItem>(5)

      expect(buffer.last()).toBeUndefined()
    })
  })

  describe("closest", () => {
    it("가장 가까운 타임스탬프의 아이템을 반환한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))
      buffer.push(createItem(3000, "c"))

      const closest = buffer.closest(2100, 500)

      expect(closest?.value).toBe("b")
    })

    it("정확히 일치하는 타임스탬프를 찾는다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))

      const closest = buffer.closest(2000, 100)

      expect(closest?.value).toBe("b")
    })

    it("windowMs 범위 내에 없으면 undefined를 반환한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))

      const closest = buffer.closest(5000, 100) // 너무 멀리 떨어진 타임스탬프

      expect(closest).toBeUndefined()
    })

    it("빈 버퍼에서 undefined를 반환한다", () => {
      const buffer = new RingBuffer<TestItem>(5)

      const closest = buffer.closest(1000, 500)

      expect(closest).toBeUndefined()
    })

    it("windowMs 경계값을 포함한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))

      // 정확히 windowMs 거리에 있는 경우
      expect(buffer.closest(1500, 500)?.value).toBe("a")
      expect(buffer.closest(1501, 500)).toBeUndefined()
    })

    it("여러 아이템 중 가장 가까운 것을 선택한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(1500, "b"))
      buffer.push(createItem(2000, "c"))
      buffer.push(createItem(2500, "d"))

      // 1800에 가장 가까운 것은 2000의 "c"
      expect(buffer.closest(1800, 500)?.value).toBe("c")
      // 1600에 가장 가까운 것은 1500의 "b"
      expect(buffer.closest(1600, 500)?.value).toBe("b")
    })

    it("음수 타임스탬프도 처리한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(-1000, "a"))
      buffer.push(createItem(-500, "b"))

      expect(buffer.closest(-600, 200)?.value).toBe("b")
    })
  })

  describe("last", () => {
    it("가장 최근에 추가된 아이템을 반환한다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))
      buffer.push(createItem(3000, "c"))

      expect(buffer.last()?.value).toBe("c")
    })

    it("버퍼가 overflow된 후에도 올바르게 동작한다", () => {
      const buffer = new RingBuffer<TestItem>(2)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))
      buffer.push(createItem(3000, "c")) // "a" 제거됨

      expect(buffer.last()?.value).toBe("c")
    })
  })

  describe("reset", () => {
    it("버퍼를 비운다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))

      buffer.reset()

      expect(buffer.last()).toBeUndefined()
      expect(buffer.closest(1000, 500)).toBeUndefined()
    })

    it("reset 후 다시 아이템을 추가할 수 있다", () => {
      const buffer = new RingBuffer<TestItem>(5)
      buffer.push(createItem(1000, "a"))
      buffer.reset()
      buffer.push(createItem(2000, "b"))

      expect(buffer.last()?.value).toBe("b")
    })
  })

  describe("순환 버퍼 동작", () => {
    it("limit이 1인 경우 항상 최신 아이템만 유지한다", () => {
      const buffer = new RingBuffer<TestItem>(1)

      buffer.push(createItem(1000, "a"))
      expect(buffer.last()?.value).toBe("a")

      buffer.push(createItem(2000, "b"))
      expect(buffer.last()?.value).toBe("b")
      expect(buffer.closest(1000, 100)).toBeUndefined()
    })

    it("limit이 큰 경우 모든 아이템을 유지한다", () => {
      const buffer = new RingBuffer<TestItem>(1000)

      for (let i = 0; i < 100; i++) {
        buffer.push(createItem(i * 1000, `item${i}`))
      }

      expect(buffer.closest(0, 100)?.value).toBe("item0")
      expect(buffer.closest(99000, 100)?.value).toBe("item99")
    })

    it("순환 후에도 올바른 순서를 유지한다", () => {
      const buffer = new RingBuffer<TestItem>(3)

      buffer.push(createItem(1000, "a"))
      buffer.push(createItem(2000, "b"))
      buffer.push(createItem(3000, "c"))
      buffer.push(createItem(4000, "d"))
      buffer.push(createItem(5000, "e"))

      // 버퍼에는 c, d, e만 남아있어야 함
      expect(buffer.closest(3000, 100)?.value).toBe("c")
      expect(buffer.closest(4000, 100)?.value).toBe("d")
      expect(buffer.closest(5000, 100)?.value).toBe("e")
    })
  })

  describe("타입 안전성", () => {
    it("제네릭 타입으로 다양한 데이터 구조를 지원한다", () => {
      interface SensorData {
        timestamp: number
        pressure: number
        temperature: number
      }

      const buffer = new RingBuffer<SensorData>(5)
      buffer.push({ timestamp: 1000, pressure: 1013, temperature: 25 })
      buffer.push({ timestamp: 2000, pressure: 1014, temperature: 26 })

      const item = buffer.closest(1500, 1000)

      expect(item?.pressure).toBeDefined()
      expect(item?.temperature).toBeDefined()
    })
  })
})
