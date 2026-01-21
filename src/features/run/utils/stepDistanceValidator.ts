/**
 * 걸음수 기반 GPS 거리 보정기
 *
 * GPS 지그재그 노이즈로 인한 거리 과측정을 걸음수 데이터로 보정합니다.
 *
 * 원리:
 * - GPS는 횡방향 오실레이션으로 실제보다 긴 거리를 측정하는 경향이 있음
 * - 걸음수 × 보폭 = 예상 거리는 상대적으로 안정적
 * - GPS 거리가 걸음수 기반 예상 거리를 크게 초과하면 보정
 *
 * 보폭 추정:
 * - 러닝 시 평균 보폭: 약 0.7~1.5m (속도에 따라 변동)
 * - 페이스 6:00/km (10 km/h) → 약 1.0~1.1m
 * - 페이스 5:00/km (12 km/h) → 약 1.2~1.3m
 * - 페이스 4:00/km (15 km/h) → 약 1.4~1.5m
 */

import {
    DEFAULT_STRIDE_LENGTH_M,
    MAX_STRIDE_LENGTH_M,
    MIN_STRIDE_LENGTH_M,
    STEP_DISTANCE_CORRECTION_THRESHOLD,
    STEP_DISTANCE_GPS_WEIGHT,
    STEP_DISTANCE_MAX_CORRECTION_RATIO,
} from "../constants";

export interface StepValidationResult {
    /** 보정된 거리 (m) */
    correctedDistance: number;
    /** 보정이 적용되었는지 여부 */
    wasCorrected: boolean;
    /** 보정 비율 (1.0 = 보정 없음, 0.8 = 20% 감소) */
    correctionRatio: number;
    /** 걸음수 기반 추정 거리 (m) */
    stepBasedDistance: number;
    /** GPS 거리 / 걸음수 거리 비율 */
    gpsToStepRatio: number;
}

export interface ValidatorConfig {
    /** 기본 보폭 (m) - 속도 정보 없을 때 사용 */
    defaultStrideLength: number;
    /** 최소 보폭 (m) */
    minStrideLength: number;
    /** 최대 보폭 (m) */
    maxStrideLength: number;
    /** GPS 거리가 걸음수 거리의 몇 배 이상이면 보정 적용 */
    correctionThreshold: number;
    /** 최대 보정 비율 (예: 0.7 = 최대 30% 감소) */
    maxCorrectionRatio: number;
    /** 보정 시 GPS와 걸음수 거리를 섞는 가중치 (0=걸음수만, 1=GPS만) */
    gpsWeight: number;
}

const DEFAULT_CONFIG: ValidatorConfig = {
    defaultStrideLength: DEFAULT_STRIDE_LENGTH_M,
    minStrideLength: MIN_STRIDE_LENGTH_M,
    maxStrideLength: MAX_STRIDE_LENGTH_M,
    correctionThreshold: STEP_DISTANCE_CORRECTION_THRESHOLD,
    maxCorrectionRatio: STEP_DISTANCE_MAX_CORRECTION_RATIO,
    gpsWeight: STEP_DISTANCE_GPS_WEIGHT,
};

export class StepDistanceValidator {
    private config: ValidatorConfig;
    private recentSpeedMps: number[] = [];
    private readonly SPEED_HISTORY_SIZE = 10;

    constructor(config: Partial<ValidatorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 속도 기반 보폭 추정 (Phase 3: 학술 연구 기반 공식으로 수정)
     *
     * 저속 (걷기, < 6 km/h): stride = 0.5 + 0.08 * speedKmh
     * 고속 (러닝, >= 6 km/h): stride = 0.4 + 0.05 * speedKmh (문헌 기반)
     *
     * 새 공식 결과:
     * - 6 km/h (걷기) → 0.98m
     * - 10 km/h (조깅) → 0.9m
     * - 12 km/h (러닝) → 1.0m
     * - 15 km/h (빠른 러닝) → 1.15m
     */
    private estimateStrideLength(speedMps: number | null): number {
        if (speedMps === null || speedMps <= 0) {
            // 최근 속도 평균 사용
            if (this.recentSpeedMps.length > 0) {
                const avgSpeed =
                    this.recentSpeedMps.reduce((a, b) => a + b, 0) /
                    this.recentSpeedMps.length;
                return this.calculateStrideFromSpeed(avgSpeed);
            }
            return this.config.defaultStrideLength;
        }

        // 속도 기록
        this.recentSpeedMps.push(speedMps);
        if (this.recentSpeedMps.length > this.SPEED_HISTORY_SIZE) {
            this.recentSpeedMps.shift();
        }

        return this.calculateStrideFromSpeed(speedMps);
    }

    private calculateStrideFromSpeed(speedMps: number): number {
        const speedKmh = speedMps * 3.6;

        // Phase 3: 저속(걷기)과 고속(러닝) 구분하여 공식 적용
        let stride: number;
        if (speedKmh < 6) {
            // 걷기: 기존 공식 유지
            stride = 0.5 + 0.08 * speedKmh;
        } else {
            // 러닝: 학술 연구 기반 공식 (보폭 과대평가 방지)
            stride = 0.4 + 0.05 * speedKmh;
        }

        // 범위 제한
        return Math.max(
            this.config.minStrideLength,
            Math.min(this.config.maxStrideLength, stride)
        );
    }

    /**
     * GPS 거리를 걸음수 데이터로 검증하고 필요시 보정
     *
     * @param gpsDistanceM GPS로 측정된 거리 (m)
     * @param stepCount 해당 구간의 걸음수
     * @param speedMps 현재 속도 (m/s), 보폭 추정에 사용
     * @returns 보정 결과
     */
    validate(
        gpsDistanceM: number,
        stepCount: number,
        speedMps: number | null
    ): StepValidationResult {
        // 걸음수가 없거나 거리가 없으면 그대로 반환
        if (stepCount <= 0 || gpsDistanceM <= 0) {
            return {
                correctedDistance: gpsDistanceM,
                wasCorrected: false,
                correctionRatio: 1.0,
                stepBasedDistance: 0,
                gpsToStepRatio: 0,
            };
        }

        // 보폭 추정
        const strideLength = this.estimateStrideLength(speedMps);

        // 걸음수 기반 거리
        const stepBasedDistance = stepCount * strideLength;

        // GPS 거리 / 걸음수 거리 비율
        const gpsToStepRatio = gpsDistanceM / stepBasedDistance;

        // 비율이 임계값 미만이면 보정 불필요
        if (gpsToStepRatio <= this.config.correctionThreshold) {
            return {
                correctedDistance: gpsDistanceM,
                wasCorrected: false,
                correctionRatio: 1.0,
                stepBasedDistance,
                gpsToStepRatio,
            };
        }

        // 보정 적용: GPS와 걸음수 거리의 가중 평균
        const blendedDistance =
            gpsDistanceM * this.config.gpsWeight +
            stepBasedDistance * (1 - this.config.gpsWeight);

        // 최대 보정 비율 적용
        const correctionRatio = Math.max(
            this.config.maxCorrectionRatio,
            blendedDistance / gpsDistanceM
        );

        const correctedDistance = gpsDistanceM * correctionRatio;

        return {
            correctedDistance,
            wasCorrected: true,
            correctionRatio,
            stepBasedDistance,
            gpsToStepRatio,
        };
    }

    /**
     * 누적 거리에 대한 보정 검증
     * 긴 구간(예: 1km)에 대해 전체적인 보정 필요성 판단
     */
    validateCumulative(
        totalGpsDistanceM: number,
        totalSteps: number,
        avgSpeedMps: number | null
    ): StepValidationResult {
        return this.validate(totalGpsDistanceM, totalSteps, avgSpeedMps);
    }

    /**
     * 상태 초기화
     */
    reset(): void {
        this.recentSpeedMps = [];
    }
}

export const stepDistanceValidator = new StepDistanceValidator();
