import { dedupeConsecutiveByLatLng } from "@/src/features/course/utils/dedupeConsecutiveByLatLng"
import { Checkpoint } from "@/src/apis/types/course"

// 테스트용 Checkpoint 생성
const createCheckpoint = (
  lat: number,
  lng: number,
  overrides: Partial<Checkpoint> = {}
): Checkpoint => ({
  lat,
  lng,
  sequence: 0,
  checkpointType: "NORMAL",
  ...overrides,
})

describe("dedupeConsecutiveByLatLng", () => {
  it("빈 배열은 빈 배열을 반환한다", () => {
    const result = dedupeConsecutiveByLatLng([])
    expect(result).toEqual([])
  })

  it("단일 요소는 그대로 반환한다", () => {
    const input = [createCheckpoint(37.5, 127.0)]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toEqual(input)
  })

  it("중복 없는 배열은 그대로 반환한다", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.51, 127.01),
      createCheckpoint(37.52, 127.02),
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(3)
  })

  it("연속된 중복 좌표를 제거한다", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.5, 127.0), // 중복
      createCheckpoint(37.51, 127.01),
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(input[0])
    expect(result[1]).toEqual(input[2])
  })

  it("연속된 여러 중복을 제거한다", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.5, 127.0), // 중복
      createCheckpoint(37.5, 127.0), // 중복
      createCheckpoint(37.51, 127.01),
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(2)
  })

  it("비연속 중복은 유지한다 (A-B-A 패턴)", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.51, 127.01),
      createCheckpoint(37.5, 127.0), // 비연속 중복 - 유지
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(3)
  })

  it("lat만 같고 lng이 다르면 중복 아님", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.5, 127.01), // lng 다름
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(2)
  })

  it("lng만 같고 lat이 다르면 중복 아님", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.51, 127.0), // lat 다름
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(2)
  })

  it("첫 번째 요소는 항상 포함한다", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.5, 127.0),
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(input[0])
  })

  it("다른 속성이 달라도 좌표가 같으면 중복으로 처리", () => {
    const input = [
      createCheckpoint(37.5, 127.0, { sequence: 1, checkpointType: "START" }),
      createCheckpoint(37.5, 127.0, { sequence: 2, checkpointType: "NORMAL" }),
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(1)
  })

  it("원본 배열을 변경하지 않는다", () => {
    const input = [
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.5, 127.0),
      createCheckpoint(37.51, 127.01),
    ]
    const inputCopy = JSON.stringify(input)

    dedupeConsecutiveByLatLng(input)

    expect(JSON.stringify(input)).toBe(inputCopy)
  })

  it("복잡한 패턴 (A-A-B-B-A-A)", () => {
    const input = [
      createCheckpoint(37.5, 127.0), // A - 유지
      createCheckpoint(37.5, 127.0), // A - 제거
      createCheckpoint(37.51, 127.01), // B - 유지
      createCheckpoint(37.51, 127.01), // B - 제거
      createCheckpoint(37.5, 127.0), // A - 유지 (비연속)
      createCheckpoint(37.5, 127.0), // A - 제거
    ]
    const result = dedupeConsecutiveByLatLng(input)
    expect(result).toHaveLength(3)
    expect(result[0].lat).toBe(37.5)
    expect(result[1].lat).toBe(37.51)
    expect(result[2].lat).toBe(37.5)
  })
})
