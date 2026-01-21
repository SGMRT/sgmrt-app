import {
  appendSegmentMeta,
  appendOne,
  SegmentMeta,
} from "@/src/features/run/context/segments"

describe("appendSegmentMeta", () => {
  describe("기본 동작", () => {
    it("빈 배열에 첫 세그먼트를 추가한다", () => {
      const result = appendSegmentMeta([], 0, 3, true)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ start: 0, end: 2, isRunning: true })
    })

    it("count가 1일 때 start와 end가 같다", () => {
      const result = appendSegmentMeta([], 5, 1, false)

      expect(result[0]).toEqual({ start: 5, end: 5, isRunning: false })
    })

    it("count가 0이하면 원본을 반환한다", () => {
      const original: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(original, 3, 0, false)

      expect(result).toEqual(original)
    })

    it("count가 음수면 원본을 반환한다", () => {
      const original: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(original, 3, -1, false)

      expect(result).toEqual(original)
    })
  })

  describe("같은 상태 + 연속 확장", () => {
    it("같은 isRunning 상태이고 연속이면 기존 세그먼트를 확장한다", () => {
      const meta: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(meta, 3, 2, true)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ start: 0, end: 4, isRunning: true })
    })

    it("같은 상태지만 연속이 아니면 새 세그먼트를 추가한다", () => {
      const meta: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(meta, 5, 2, true) // 3,4 건너뜀

      expect(result).toHaveLength(2)
      expect(result[1]).toEqual({ start: 5, end: 6, isRunning: true })
    })
  })

  describe("다른 상태로 전환 (브리지 포인트)", () => {
    it("다른 상태로 바뀌고 연속이면 브리지 포인트를 포함한다", () => {
      const meta: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(meta, 3, 2, false)

      expect(result).toHaveLength(2)
      // 브리지 포인트: start-1 = 2 포함
      expect(result[1]).toEqual({ start: 2, end: 4, isRunning: false })
    })

    it("다른 상태지만 연속이 아니면 브리지 포인트가 없다", () => {
      const meta: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(meta, 5, 2, false) // 3,4 건너뜀

      expect(result).toHaveLength(2)
      expect(result[1]).toEqual({ start: 5, end: 6, isRunning: false })
    })

    it("브리지 포인트가 음수가 되지 않도록 한다", () => {
      const meta: SegmentMeta[] = [{ start: 0, end: 0, isRunning: true }]
      const result = appendSegmentMeta(meta, 1, 2, false)

      expect(result).toHaveLength(2)
      // start-1 = 0, Math.max(0, 0) = 0
      expect(result[1].start).toBe(0)
    })
  })

  describe("불변성", () => {
    it("원본 배열을 변경하지 않는다", () => {
      const original: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const originalCopy = JSON.stringify(original)

      appendSegmentMeta(original, 3, 2, false)

      expect(JSON.stringify(original)).toBe(originalCopy)
    })

    it("새 배열을 반환한다", () => {
      const original: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]
      const result = appendSegmentMeta(original, 3, 2, true)

      expect(result).not.toBe(original)
    })
  })

  describe("복잡한 시나리오", () => {
    it("러닝 → 일시정지 → 러닝 전환", () => {
      let segments: SegmentMeta[] = []

      // 러닝 시작 (0-4)
      segments = appendSegmentMeta(segments, 0, 5, true)
      expect(segments).toHaveLength(1)
      expect(segments[0]).toEqual({ start: 0, end: 4, isRunning: true })

      // 일시정지 (5-7)
      segments = appendSegmentMeta(segments, 5, 3, false)
      expect(segments).toHaveLength(2)
      expect(segments[1]).toEqual({ start: 4, end: 7, isRunning: false }) // 브리지

      // 러닝 재개 (8-10)
      segments = appendSegmentMeta(segments, 8, 3, true)
      expect(segments).toHaveLength(3)
      expect(segments[2]).toEqual({ start: 7, end: 10, isRunning: true }) // 브리지
    })

    it("연속 확장 후 상태 전환", () => {
      let segments: SegmentMeta[] = []

      // 러닝 (0-2)
      segments = appendSegmentMeta(segments, 0, 3, true)
      // 연속 러닝 확장 (3-5)
      segments = appendSegmentMeta(segments, 3, 3, true)
      expect(segments).toHaveLength(1)
      expect(segments[0]).toEqual({ start: 0, end: 5, isRunning: true })

      // 일시정지로 전환 (6-8)
      segments = appendSegmentMeta(segments, 6, 3, false)
      expect(segments).toHaveLength(2)
      expect(segments[1]).toEqual({ start: 5, end: 8, isRunning: false })
    })
  })
})

describe("appendOne", () => {
  it("단일 인덱스를 추가한다", () => {
    const result = appendOne([], 0, true)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: 0, end: 0, isRunning: true })
  })

  it("연속된 같은 상태는 확장한다", () => {
    let segments: SegmentMeta[] = []

    segments = appendOne(segments, 0, true)
    segments = appendOne(segments, 1, true)
    segments = appendOne(segments, 2, true)

    expect(segments).toHaveLength(1)
    expect(segments[0]).toEqual({ start: 0, end: 2, isRunning: true })
  })

  it("상태가 바뀌면 브리지 포인트를 포함한 새 세그먼트를 생성한다", () => {
    let segments: SegmentMeta[] = []

    segments = appendOne(segments, 0, true)
    segments = appendOne(segments, 1, true)
    segments = appendOne(segments, 2, false) // 상태 변경

    expect(segments).toHaveLength(2)
    expect(segments[0]).toEqual({ start: 0, end: 1, isRunning: true })
    expect(segments[1]).toEqual({ start: 1, end: 2, isRunning: false }) // 브리지
  })

  it("appendSegmentMeta를 count=1로 호출한다", () => {
    const segments: SegmentMeta[] = [{ start: 0, end: 2, isRunning: true }]

    const result = appendOne(segments, 3, true)

    expect(result).toHaveLength(1)
    expect(result[0].end).toBe(3)
  })
})
