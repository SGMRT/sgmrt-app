/**
 * GPS 필터링 파이프라인 타입 정의
 */

/** GPS 포인트 (필터 입력용) */
export interface GpsPoint {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
    speed: number | null;
    course: number | null;
}

/** 이상치 감지 결과 */
export interface OutlierResult {
    isOutlier: boolean;
    reason?: "accuracy" | "speed" | "acceleration" | "jump";
    confidence: number; // 0-1, 유효 신뢰도
}

/** 이동 상태 */
export type MovementState = "STATIONARY" | "WALKING" | "RUNNING";

/** 거리 누적 결과 */
export interface DistanceResult {
    delta: number; // 구간 거리 (m)
    total: number; // 누적 거리 (m)
    rawDelta: number; // 필터 전 거리 (디버깅용)
}

/** 페이스 계산 결과 */
export interface PaceResult {
    currentPace: number | null; // 초/km
    isStable: boolean; // 안정 상태 여부
}

/** 이상치 감지 설정 */
export interface OutlierConfig {
    maxSpeedMps: number; // 최대 허용 속도 (m/s)
    maxAccelerationMps2: number; // 최대 허용 가속도 (m/s^2)
    minAccuracyM: number; // 최소 정확도 요구 (m)
    maxJumpM: number; // 최대 허용 점프 거리 (m)
}

/** 이동 분류 설정 */
export interface MovementConfig {
    stationarySpeedThreshold: number; // 정지 판정 속도 (m/s)
    walkingSpeedThreshold: number; // 걷기/달리기 경계 (m/s)
    stationaryVarianceThreshold: number; // 정지 판정 분산 (m)
    windowSize: number; // 판정 윈도우 크기
}

/** 거리 누적 설정 */
export interface DistanceConfig {
    minConfidence: number; // 최소 신뢰도 (0-1)
    smoothingFactor: number; // 거리 스무딩 계수 (0-1)
    gpsCorrection: number; // GPS 과대 측정 보정 계수 (0.97 = 3% 감소)
    minDeltaM: number; // 최소 거리 임계값 (이 값 미만은 GPS 노이즈로 간주)
}

/** 페이스 계산 설정 */
export interface PaceConfig {
    emaTauSec: number; // EMA 시간 상수 (초)
    maxPaceChangePerSec: number; // 초당 최대 페이스 변화 (초/km)
    outlierPaceThreshold: number; // 이상치 페이스 임계값 (초/km)
}
