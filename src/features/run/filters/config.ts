/**
 * GPS 필터링 파이프라인 설정
 */

import type {
    DistanceConfig,
    MovementConfig,
    OutlierConfig,
    PaceConfig,
} from "./types";

/** GPS 파이프라인 버전 */
export type GpsPipelineVersion = "legacy" | "v2";

/**
 * 현재 사용할 GPS 파이프라인 버전
 * - legacy: 기존 칼만 필터 + haversine 방식
 * - v2: OutlierDetector + 칼만 필터 + MovementClassifier + DistanceAccumulator
 */
export const GPS_PIPELINE_VERSION: GpsPipelineVersion = "v2";

/** 이상치 감지 설정 */
export const OUTLIER_CONFIG: OutlierConfig = {
    /** 최대 허용 속도 (12m/s = 43.2km/h, 세계 기록 수준) */
    maxSpeedMps: 12,
    /** 최대 허용 가속도 (5m/s^2, 물리적 한계) */
    maxAccelerationMps2: 5,
    /** GPS 정확도 임계값 (20m 초과시 이상치) */
    minAccuracyM: 20,
    /** 최대 허용 순간 점프 거리 (50m) */
    maxJumpM: 50,
};

/** 이동 분류 설정 */
export const MOVEMENT_CONFIG: MovementConfig = {
    /** 정지 판정 속도 (0.1m/s ≈ 0.36km/h, 매우 보수적) */
    stationarySpeedThreshold: 0.1,
    /** 걷기/달리기 경계 속도 (2.0m/s ≈ 7.2km/h) */
    walkingSpeedThreshold: 2.0,
    /**
     * 정지 판정 위치 분산 (m)
     * raw GPS는 정지 상태에서도 1~3m 지터가 있으므로 이를 흡수해야 함
     * (속도 + 스텝 게이트가 함께 걸려 있어 이동 중 오판 위험은 낮음)
     */
    stationaryVarianceThreshold: 2.5,
    /** 이동 상태 판정 윈도우 크기 */
    windowSize: 5,
};

/** 거리 누적 설정 */
export const DISTANCE_CONFIG: DistanceConfig = {
    /** 최소 신뢰도 (0.3 이하는 0.3으로 클램프) */
    minConfidence: 0.3,
    /** 거리 스무딩 계수 (0.8 = 새 값 80% 반영) */
    smoothingFactor: 0.8,
    /** GPS 거리 보정 계수 (실측 후 재조정, 1.0 = 보정 없음) */
    gpsCorrection: 1.0,
    /** 최소 거리 임계값 (이 값 미만은 GPS 노이즈로 간주, 미터) */
    minDeltaM: 1.0,
};

/** 페이스 계산 설정 */
export const PACE_CONFIG: PaceConfig = {
    /** 페이스 합산 윈도우 (10초) */
    windowSec: 10,
    /** 최소 유효 페이스 (90초/km = 40km/h, Bolt 100m WR ≈ 96초/km) */
    minPaceSecPerKm: 90,
    /** 이상치 페이스 임계값 (1200초/km = 20분/km) */
    outlierPaceThreshold: 1200,
};
