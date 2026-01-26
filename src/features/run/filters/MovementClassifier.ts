/**
 * 이동/정지 분류기
 *
 * 속도, 위치 분산, 스텝 데이터를 결합하여 이동 상태를 판정합니다.
 * 정지 상태에서는 거리 누적을 완전히 차단합니다.
 */

import { haversineMeters } from "../utils/haversineMeters";
import { MOVEMENT_CONFIG } from "./config";
import type { MovementConfig, MovementState } from "./types";

interface PositionSample {
    latitude: number;
    longitude: number;
    timestamp: number;
}

export class MovementClassifier {
    private readonly config: MovementConfig;
    private readonly speedBuffer: number[] = [];
    private readonly positionBuffer: PositionSample[] = [];
    private lastClassification: MovementState = "STATIONARY";

    constructor(config: MovementConfig = MOVEMENT_CONFIG) {
        this.config = config;
    }

    /**
     * 이동 상태 분류
     *
     * @param estimatedSpeed 추정 속도 (m/s)
     * @param position 현재 위치
     * @param deltaSteps 구간 스텝 수 (null이면 스텝 데이터 없음)
     */
    classify(
        estimatedSpeed: number,
        position: { latitude: number; longitude: number },
        deltaSteps: number | null
    ): MovementState {
        // 버퍼에 추가
        this.speedBuffer.push(estimatedSpeed);
        this.positionBuffer.push({
            ...position,
            timestamp: Date.now(),
        });

        // 윈도우 크기 유지
        while (this.speedBuffer.length > this.config.windowSize) {
            this.speedBuffer.shift();
        }
        while (this.positionBuffer.length > this.config.windowSize) {
            this.positionBuffer.shift();
        }

        // 평균 속도 계산
        const avgSpeed = this.calculateAverageSpeed();

        // 위치 분산 계산
        const posVariance = this.calculatePositionVariance();

        // 스텝 기반 이동 감지
        const hasStepMovement = deltaSteps != null && deltaSteps > 0;

        // 정지 상태 판정
        // - 속도가 임계값 미만
        // - 위치 분산이 임계값 미만
        // - 스텝 이동이 없음
        if (
            avgSpeed < this.config.stationarySpeedThreshold &&
            posVariance < this.config.stationaryVarianceThreshold &&
            !hasStepMovement
        ) {
            this.lastClassification = "STATIONARY";
            return "STATIONARY";
        }

        // 걷기/달리기 구분
        if (avgSpeed < this.config.walkingSpeedThreshold) {
            this.lastClassification = "WALKING";
            return "WALKING";
        }

        this.lastClassification = "RUNNING";
        return "RUNNING";
    }

    /**
     * 버퍼의 평균 속도 계산
     */
    private calculateAverageSpeed(): number {
        if (this.speedBuffer.length === 0) {
            return 0;
        }
        const sum = this.speedBuffer.reduce((a, b) => a + b, 0);
        return sum / this.speedBuffer.length;
    }

    /**
     * 위치 분산 계산 (미터 단위)
     * 중심점에서 각 포인트까지의 평균 거리
     */
    private calculatePositionVariance(): number {
        if (this.positionBuffer.length < 2) {
            return 0;
        }

        // 중심점 계산
        let sumLat = 0;
        let sumLng = 0;
        for (const pos of this.positionBuffer) {
            sumLat += pos.latitude;
            sumLng += pos.longitude;
        }
        const centerLat = sumLat / this.positionBuffer.length;
        const centerLng = sumLng / this.positionBuffer.length;

        // 중심점에서 각 포인트까지의 거리 합
        let totalDist = 0;
        for (const pos of this.positionBuffer) {
            totalDist += haversineMeters(
                centerLat,
                centerLng,
                pos.latitude,
                pos.longitude
            );
        }

        return totalDist / this.positionBuffer.length;
    }

    /**
     * 마지막 분류 결과 반환
     */
    getLastClassification(): MovementState {
        return this.lastClassification;
    }

    /**
     * 분류기 상태 초기화
     */
    reset(): void {
        this.speedBuffer.length = 0;
        this.positionBuffer.length = 0;
        this.lastClassification = "STATIONARY";
    }
}

/** 싱글톤 인스턴스 */
export const movementClassifier = new MovementClassifier();
