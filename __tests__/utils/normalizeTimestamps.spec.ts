import { normalizeTimestamps } from "@/src/utils/normalizeTimestamps"

describe("normalizeTimestamps", () => {
  it("빈 배열은 빈 배열 반환", () => {
    expect(normalizeTimestamps([])).toEqual([])
  })

  it("단일 요소는 초 단위로 간주되어 변환됨 (delta 없으면 avgDelta=0)", () => {
    // 단일 요소 → deltas 비어있음 → avgDelta = 0 → 0 < 10 → 초 단위로 간주
    const input = [{ timeStamp: 1000 }]
    const result = normalizeTimestamps(input)
    expect(result).toHaveLength(1)
    expect(result[0].timeStamp).toBe(1000000) // 1000 * 1000
  })

  it("ms 단위 타임스탬프는 변환하지 않음 (avgDelta >= 10)", () => {
    const input = [
      { timeStamp: 1000 },
      { timeStamp: 2000 }, // delta = 1000
      { timeStamp: 3000 },
    ]
    const result = normalizeTimestamps(input)
    expect(result[0].timeStamp).toBe(1000)
    expect(result[1].timeStamp).toBe(2000)
    expect(result[2].timeStamp).toBe(3000)
  })

  it("초 단위 타임스탬프는 ms로 변환 (avgDelta < 10)", () => {
    const input = [
      { timeStamp: 1 },
      { timeStamp: 2 }, // delta = 1
      { timeStamp: 3 },
    ]
    const result = normalizeTimestamps(input)
    expect(result[0].timeStamp).toBe(1000)
    expect(result[1].timeStamp).toBe(2000)
    expect(result[2].timeStamp).toBe(3000)
  })

  it("경계값 테스트 (avgDelta = 10은 ms 단위로 간주)", () => {
    const input = [
      { timeStamp: 0 },
      { timeStamp: 10 }, // delta = 10
      { timeStamp: 20 },
    ]
    const result = normalizeTimestamps(input)
    // avgDelta = 10, 10 < 10 is false → ms 단위로 유지
    expect(result[0].timeStamp).toBe(0)
    expect(result[1].timeStamp).toBe(10)
  })

  it("다른 속성은 유지됨", () => {
    const input = [
      { timeStamp: 1, lat: 37.5, lng: 127.0 },
      { timeStamp: 2, lat: 37.51, lng: 127.01 },
    ]
    const result = normalizeTimestamps(input)
    expect(result[0].lat).toBe(37.5)
    expect(result[0].lng).toBe(127.0)
    expect(result[1].lat).toBe(37.51)
    expect(result[1].lng).toBe(127.01)
  })

  it("최대 10개 샘플만 사용하여 단위 추정", () => {
    // 12개 요소, 첫 10개 delta로 추정
    const input = Array.from({ length: 12 }, (_, i) => ({
      timeStamp: i * 1000, // ms 단위
    }))
    const result = normalizeTimestamps(input)
    expect(result[0].timeStamp).toBe(0)
    expect(result[11].timeStamp).toBe(11000)
  })

  it("timeStamp가 없는 요소는 delta 계산에서 제외", () => {
    const input = [
      { timeStamp: 1 },
      { otherField: "test" }, // timeStamp 없음
      { timeStamp: 2 },
    ]
    const result = normalizeTimestamps(input)
    // delta = 1 (1->2)
    expect(result[0].timeStamp).toBe(1000)
    expect(result[2].timeStamp).toBe(2000)
  })

  it("원본 배열을 변경하지 않음 (immutability)", () => {
    const input = [
      { timeStamp: 1 },
      { timeStamp: 2 },
    ]
    const originalTimestamp = input[0].timeStamp
    normalizeTimestamps(input)
    expect(input[0].timeStamp).toBe(originalTimestamp)
  })
})
