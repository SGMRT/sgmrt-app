import {
  calculateCenter,
  calculateZoomLevelFromSize,
  convertTelemetriesToCourse,
  getDistance,
  getTopCoordinate,
  Coordinate,
} from "@/src/utils/mapUtils"
import { Telemetry } from "@/src/apis/types/run"
import { Dimensions } from "react-native"

// react-native Dimensions mock
jest.mock("react-native", () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 400, height: 800 })),
  },
}))

// 테스트용 좌표 생성
const createCoordinate = (lat: number, lng: number): Coordinate => ({
  lat,
  lng,
})

// 테스트용 텔레메트리 생성
const createTelemetry = (
  lat: number,
  lng: number,
  overrides: Partial<Telemetry> = {}
): Telemetry => ({
  timeStamp: Date.now(),
  lat,
  lng,
  dist: 0,
  pace: 300,
  alt: 50,
  cadence: 160,
  bpm: 140,
  isRunning: true,
  ...overrides,
})

describe("getDistance (Haversine 거리 계산)", () => {
  it("같은 좌표 간 거리는 0이다", () => {
    const coord = createCoordinate(37.5, 127.0)
    const distance = getDistance(coord, coord)
    expect(distance).toBe(0)
  })

  it("서울-부산 거리를 약 320km로 계산한다", () => {
    // 서울 (약 37.5665, 126.9780)
    // 부산 (약 35.1796, 129.0756)
    const seoul = createCoordinate(37.5665, 126.978)
    const busan = createCoordinate(35.1796, 129.0756)

    const distance = getDistance(seoul, busan)

    // 실제 거리는 약 325km
    expect(distance).toBeGreaterThan(300000)
    expect(distance).toBeLessThan(350000)
  })

  it("짧은 거리도 정확하게 계산한다 (~100m)", () => {
    // 위도 1도 ≈ 111km, 0.001도 ≈ 111m
    const point1 = createCoordinate(37.5, 127.0)
    const point2 = createCoordinate(37.501, 127.0)

    const distance = getDistance(point1, point2)

    expect(distance).toBeGreaterThan(100)
    expect(distance).toBeLessThan(120)
  })

  it("경도 방향 이동도 계산한다", () => {
    const point1 = createCoordinate(37.5, 127.0)
    const point2 = createCoordinate(37.5, 127.001)

    const distance = getDistance(point1, point2)

    // 위도 37.5도에서 경도 0.001도 ≈ 약 90m
    expect(distance).toBeGreaterThan(80)
    expect(distance).toBeLessThan(100)
  })

  it("음수 좌표도 처리한다", () => {
    const point1 = createCoordinate(-33.8688, 151.2093) // Sydney
    const point2 = createCoordinate(-37.8136, 144.9631) // Melbourne

    const distance = getDistance(point1, point2)

    // 약 713km
    expect(distance).toBeGreaterThan(700000)
    expect(distance).toBeLessThan(750000)
  })

  it("적도 근처에서도 정확하게 계산한다", () => {
    const point1 = createCoordinate(0, 0)
    const point2 = createCoordinate(0, 1)

    const distance = getDistance(point1, point2)

    // 적도에서 경도 1도 ≈ 111.32km
    expect(distance).toBeGreaterThan(110000)
    expect(distance).toBeLessThan(113000)
  })
})

describe("calculateCenter", () => {
  it("단일 좌표의 중심은 자기 자신이다", () => {
    const coords = [createCoordinate(37.5, 127.0)]
    const result = calculateCenter(coords)

    expect(result.latitude).toBe(37.5)
    expect(result.longitude).toBe(127.0)
    expect(result.size).toBe(0)
  })

  it("두 좌표의 중심을 계산한다", () => {
    const coords = [
      createCoordinate(37.0, 127.0),
      createCoordinate(38.0, 128.0),
    ]

    const result = calculateCenter(coords)

    expect(result.latitude).toBe(37.5)
    expect(result.longitude).toBe(127.5)
  })

  it("여러 좌표의 중심을 계산한다", () => {
    const coords = [
      createCoordinate(37.0, 127.0),
      createCoordinate(37.0, 129.0),
      createCoordinate(39.0, 127.0),
      createCoordinate(39.0, 129.0),
    ]

    const result = calculateCenter(coords)

    expect(result.latitude).toBe(38.0)
    expect(result.longitude).toBe(128.0)
  })

  it("가로/세로 중 더 긴 쪽을 size로 반환한다 (가로)", () => {
    const coords = [
      createCoordinate(37.0, 127.0), // 가로 2도
      createCoordinate(37.5, 129.0), // 세로 0.5도
    ]

    const result = calculateCenter(coords)

    expect(result.size).toBe(2) // 가로가 더 길다
  })

  it("가로/세로 중 더 긴 쪽을 size로 반환한다 (세로)", () => {
    const coords = [
      createCoordinate(36.0, 127.0), // 세로 2도
      createCoordinate(38.0, 127.5), // 가로 0.5도
    ]

    const result = calculateCenter(coords)

    expect(result.size).toBe(2) // 세로가 더 길다
  })

  it("음수 좌표도 처리한다", () => {
    const coords = [
      createCoordinate(-34.0, 150.0),
      createCoordinate(-36.0, 152.0),
    ]

    const result = calculateCenter(coords)

    expect(result.latitude).toBe(-35.0)
    expect(result.longitude).toBe(151.0)
  })
})

describe("getTopCoordinate", () => {
  it("가장 높은 위도를 가진 좌표를 반환한다", () => {
    const coords = [
      createCoordinate(37.0, 127.0),
      createCoordinate(38.5, 128.0),
      createCoordinate(37.5, 129.0),
    ]

    const result = getTopCoordinate(coords)

    expect(result.lat).toBe(38.5)
    expect(result.lng).toBe(128.0)
  })

  it("단일 좌표는 자기 자신을 반환한다", () => {
    const coords = [createCoordinate(37.5, 127.0)]

    const result = getTopCoordinate(coords)

    expect(result.lat).toBe(37.5)
    expect(result.lng).toBe(127.0)
  })

  it("음수 위도도 처리한다", () => {
    const coords = [
      createCoordinate(-36.0, 150.0),
      createCoordinate(-34.0, 151.0), // 가장 높은 위도 (-34가 -36보다 큼)
      createCoordinate(-38.0, 152.0),
    ]

    const result = getTopCoordinate(coords)

    expect(result.lat).toBe(-34.0)
    expect(result.lng).toBe(151.0)
  })

  it("같은 위도가 여러 개면 첫 번째를 반환한다", () => {
    const coords = [
      createCoordinate(38.0, 127.0),
      createCoordinate(38.0, 128.0),
      createCoordinate(37.0, 129.0),
    ]

    const result = getTopCoordinate(coords)

    expect(result.lat).toBe(38.0)
    expect(result.lng).toBe(127.0) // 첫 번째 38.0 좌표
  })
})

describe("convertTelemetriesToCourse", () => {
  it("텔레메트리를 코스 응답 형식으로 변환한다", () => {
    const telemetries = [
      createTelemetry(37.5, 127.0),
      createTelemetry(37.501, 127.001),
    ]

    const result = convertTelemetriesToCourse(telemetries)

    expect(result.id).toBe(0)
    expect(result.name).toBe("")
    expect(result.startLat).toBe(37.5)
    expect(result.startLng).toBe(127.0)
    expect(result.telemetries).toEqual(telemetries)
    expect(result.distance).toBe(0)
    expect(result.elevationGain).toBe(0)
    expect(result.elevationLoss).toBe(0)
    expect(result.runnersCount).toBe(0)
  })

  it("시작 좌표를 첫 번째 텔레메트리에서 가져온다", () => {
    const telemetries = [
      createTelemetry(35.0, 125.0),
      createTelemetry(36.0, 126.0),
    ]

    const result = convertTelemetriesToCourse(telemetries)

    expect(result.startLat).toBe(35.0)
    expect(result.startLng).toBe(125.0)
  })

  it("단일 러너 정보를 포함한다", () => {
    const telemetries = [createTelemetry(37.5, 127.0)]

    const result = convertTelemetriesToCourse(telemetries)

    expect(result.runners).toHaveLength(1)
    expect(result.runners[0].uuId).toBe("")
    expect(result.runners[0].profileUrl).toBe("")
  })
})

describe("calculateZoomLevelFromSize", () => {
  beforeEach(() => {
    ;(Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800 })
  })

  it("작은 영역에서 높은 줌 레벨을 반환한다", () => {
    const sizeInDegrees = 0.01 // 약 1km
    const centerLat = 37.5

    const zoom = calculateZoomLevelFromSize(sizeInDegrees, centerLat)

    expect(zoom).toBeGreaterThan(12)
  })

  it("큰 영역에서 낮은 줌 레벨을 반환한다", () => {
    const sizeInDegrees = 1 // 약 100km
    const centerLat = 37.5

    const zoom = calculateZoomLevelFromSize(sizeInDegrees, centerLat)

    expect(zoom).toBeLessThan(10)
  })

  it("위도에 따라 줌 레벨이 조정된다", () => {
    const sizeInDegrees = 0.1

    const zoomAtEquator = calculateZoomLevelFromSize(sizeInDegrees, 0)
    const zoomAtHighLat = calculateZoomLevelFromSize(sizeInDegrees, 60)

    // 고위도에서는 같은 degree가 더 짧은 거리이므로 높은 줌
    expect(zoomAtHighLat).toBeGreaterThan(zoomAtEquator)
  })

  it("커스텀 화면 너비를 사용할 수 있다", () => {
    const sizeInDegrees = 0.1
    const centerLat = 37.5

    const zoomNarrow = calculateZoomLevelFromSize(sizeInDegrees, centerLat, 200)
    const zoomWide = calculateZoomLevelFromSize(sizeInDegrees, centerLat, 600)

    // 넓은 화면에서 더 높은 줌 (같은 영역을 더 크게 표시)
    // 공식: log2((metersPerPixelAtZoom0 * screenWidth) / meters) - 2
    expect(zoomWide).toBeGreaterThan(zoomNarrow)
  })

  it("화면 너비가 없으면 기본값(400)을 사용한다", () => {
    const sizeInDegrees = 0.1
    const centerLat = 37.5

    const zoomDefault = calculateZoomLevelFromSize(sizeInDegrees, centerLat)
    const zoomExplicit = calculateZoomLevelFromSize(
      sizeInDegrees,
      centerLat,
      400
    )

    expect(zoomDefault).toBe(zoomExplicit)
  })

  it("결과는 숫자이다", () => {
    const zoom = calculateZoomLevelFromSize(0.1, 37.5)
    expect(typeof zoom).toBe("number")
    expect(Number.isFinite(zoom)).toBe(true)
  })
})
