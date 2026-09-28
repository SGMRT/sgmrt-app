/**
 * 정확도 가중 거리 누적기
 *
 * - 정지 상태에서는 거리 누적 안함
 * - GPS 신뢰도(confidence)에 따라 가중치 적용
 * - 급격한 거리 변화 스무딩
 */

import { DISTANCE_CONFIG } from "../filters/config";
import type { DistanceConfig, DistanceResult, MovementState } from "../filters/types";
import { haversineMeters } from "../utils/haversineMeters";

interface Position {
    latitude: number;
    longitude: number;
}

interface AccumulatorState {
    totalDistance: number;
    rawDistance: number;
    lastPosition: Position | null;
    lastTimestamp: number;
    recentSamples: { deltaM: number; dtSec: number }[];
}

export class DistanceAccumulator {
    private readonly config: DistanceConfig;
    private state: AccumulatorState;
    private readonly DELTA_HISTORY_SIZE = 5;

    constructor(config: DistanceConfig = DISTANCE_CONFIG) {
        this.config = config;
        this.state = this.createInitialState();
    }

    private createInitialState(): AccumulatorState {
        return {
            totalDistance: 0,
            rawDistance: 0,
            lastPosition: null,
            lastTimestamp: 0,
            recentSamples: [],
        };
    }

    /**
     * 거리 누적
     *
     * @param position 현재 위치
     * @param confidence GPS 신뢰도 (0-1)
     * @param movementState 이동 상태
     * @param timestamp 타임스탬프
     */
    accumulate(
        position: Position,
        confidence: number,
        movementState: MovementState,
        timestamp: number
    ): DistanceResult {
        // 첫 번째 포인트
        if (this.state.lastPosition === null) {
            this.state = {
                ...this.state,
                lastPosition: { ...position },
                lastTimestamp: timestamp,
            };
            return {
                delta: 0,
                total: 0,
                rawDelta: 0,
            };
        }

        // 정지 상태면 거리 누적 안함
        if (movementState === "STATIONARY") {
            // 위치는 업데이트하되 거리는 누적하지 않음
            this.state = {
                ...this.state,
                lastPosition: { ...position },
                lastTimestamp: timestamp,
            };
            return {
                delta: 0,
                total: this.state.totalDistance,
                rawDelta: 0,
            };
        }

        // Haversine 거리 계산
        const rawDelta = haversineMeters(
            this.state.lastPosition.latitude,
            this.state.lastPosition.longitude,
            position.latitude,
            position.longitude
        );

        // 최소 거리 임계값 체크 (GPS 노이즈 필터링)
        if (rawDelta < this.config.minDeltaM) {
            // 너무 작은 이동은 GPS 노이즈로 간주
            this.state = {
                ...this.state,
                lastPosition: { ...position },
                lastTimestamp: timestamp,
            };
            return {
                delta: 0,
                total: this.state.totalDistance,
                rawDelta,
            };
        }

        // 신뢰도 가중 거리
        const effectiveConfidence = Math.max(
            this.config.minConfidence,
            confidence
        );

        // 스무딩 적용 (경과 시간 기준으로 이상치 판정)
        const dtSec =
            this.state.lastTimestamp > 0
                ? (timestamp - this.state.lastTimestamp) / 1000
                : 0;
        const smoothedDelta = this.applySmoothing(
            rawDelta,
            effectiveConfidence,
            dtSec
        );

        // GPS 보정 계수 적용 (GPS 과대 측정 보정)
        const correctedDelta = smoothedDelta * this.config.gpsCorrection;

        // 상태 업데이트 (불변성 유지)
        // 히스토리는 보정 전 값으로 유지 (평균 계산용)
        const newRecentSamples = [
            ...this.state.recentSamples,
            { deltaM: smoothedDelta, dtSec },
        ];
        while (newRecentSamples.length > this.DELTA_HISTORY_SIZE) {
            newRecentSamples.shift();
        }

        this.state = {
            totalDistance: this.state.totalDistance + correctedDelta,
            rawDistance: this.state.rawDistance + rawDelta,
            lastPosition: { ...position },
            lastTimestamp: timestamp,
            recentSamples: newRecentSamples,
        };

        return {
            delta: correctedDelta,
            total: this.state.totalDistance,
            rawDelta,
        };
    }

    /**
     * 거리 스무딩 적용
     *
     * - 이상치: 기대 이동 거리와 블렌딩
     * - 저신뢰도 샘플: 신뢰도 기반 감소
     * - 정상 샘플: 그대로 사용
     *
     * 이상치 판정은 경과 시간을 반영한다: 신호 유실(터널) 후의 긴 dt
     * 델타는 절대값이 커도 속도가 정상이면 이상치가 아니다.
     */
    private applySmoothing(
        delta: number,
        confidence: number,
        dtSec: number
    ): number {
        const avgRateMps = this.getAverageRateMps();

        // 히스토리가 없거나 시간 증분이 없으면 그대로 반환
        if (avgRateMps === 0 || dtSec <= 0) {
            return delta;
        }

        // 이상치 감지: 경과 시간 기준 기대 이동 거리의 3배 초과 시 스무딩
        const expectedDelta = avgRateMps * dtSec;
        if (delta > expectedDelta * 3) {
            // 이상치: 기대 이동 거리와 블렌딩
            const factor = Math.max(0.5, confidence);
            return delta * factor + expectedDelta * (1 - factor);
        }

        // 저신뢰도 샘플 (confidence < 0.7): 신뢰도 기반 감소
        // confidence 0.3 → 0.85배, confidence 0.7+ → 1.0배
        if (confidence < 0.7) {
            const reductionFactor = 0.85 + (confidence - 0.3) * (0.15 / 0.4);
            return delta * Math.max(0.85, reductionFactor);
        }

        // 정상 범위: 거리 그대로 사용
        return delta;
    }

    /**
     * 최근 구간의 평균 이동 속도 (m/s)
     */
    private getAverageRateMps(): number {
        let sumDeltaM = 0;
        let sumDtSec = 0;
        for (const sample of this.state.recentSamples) {
            sumDeltaM += sample.deltaM;
            sumDtSec += sample.dtSec;
        }
        return sumDtSec > 0 ? sumDeltaM / sumDtSec : 0;
    }

    /**
     * 현재 누적 거리 반환
     */
    getTotalDistance(): number {
        return this.state.totalDistance;
    }

    /**
     * 필터 전 누적 거리 반환 (디버깅용)
     */
    getRawDistance(): number {
        return this.state.rawDistance;
    }

    /**
     * 마지막 위치 반환
     */
    getLastPosition(): Position | null {
        return this.state.lastPosition
            ? { ...this.state.lastPosition }
            : null;
    }

    /**
     * 앵커 재설정
     *
     * 신호 유실 후 GPS가 먼 위치로 재배치됐을 때, 이전 위치와의
     * 직선 거리를 누적하지 않고 새 위치에서 누적을 다시 시작한다.
     */
    reanchor(position: Position, timestamp: number): void {
        this.state = {
            ...this.state,
            lastPosition: { ...position },
            lastTimestamp: timestamp,
            recentSamples: [],
        };
    }

    /**
     * 누적기 상태 초기화
     */
    reset(): void {
        this.state = this.createInitialState();
    }
}

/** 싱글톤 인스턴스 */
export const distanceAccumulator = new DistanceAccumulator();
