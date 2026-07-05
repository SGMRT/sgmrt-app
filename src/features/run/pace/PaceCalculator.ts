/**
 * EMA 기반 페이스 계산기
 *
 * - 지수이동평균(EMA)으로 급격한 변화 감쇄
 * - 페이스 변화율 제한
 * - 이상치 페이스 자동 필터링
 */

import { PACE_CONFIG } from "../filters/config";
import type { PaceConfig, PaceResult } from "../filters/types";

export class PaceCalculator {
    private readonly config: PaceConfig;
    private emaPace: number | null = null;
    private sampleCount = 0;
    private lastTimestamp = 0;

    constructor(config: PaceConfig = PACE_CONFIG) {
        this.config = config;
    }

    /**
     * EMA 기반 페이스 계산
     *
     * @param distanceDelta 구간 거리 (m)
     * @param timeDeltaMs 구간 시간 (ms)
     * @param timestamp 현재 타임스탬프
     */
    calculate(
        distanceDelta: number,
        timeDeltaMs: number,
        timestamp: number
    ): PaceResult {
        // 유효하지 않은 입력
        if (distanceDelta <= 0 || timeDeltaMs <= 0) {
            return {
                currentPace: this.emaPace,
                isStable: this.sampleCount >= 5,
            };
        }

        // 순간 페이스 계산 (초/km)
        const timeDeltaSec = timeDeltaMs / 1000;
        const distanceKm = distanceDelta / 1000;
        const instantPace = timeDeltaSec / distanceKm;

        // 이상치 필터링 (20분/km 초과)
        if (instantPace > this.config.outlierPaceThreshold) {
            return {
                currentPace: this.emaPace,
                isStable: this.sampleCount >= 5,
            };
        }

        // 너무 빠른 페이스도 필터링 (1분30초/km 미만 = 40km/h 이상, Bolt 100m WR ≈ 96초/km)
        if (instantPace < 90) {
            return {
                currentPace: this.emaPace,
                isStable: this.sampleCount >= 5,
            };
        }

        // EMA 알파 계산
        const dtSec =
            this.lastTimestamp > 0 ? (timestamp - this.lastTimestamp) / 1000 : 1;
        const alpha = this.calculateAlpha(dtSec);

        if (this.emaPace === null) {
            // 첫 번째 유효 페이스
            this.emaPace = instantPace;
        } else {
            // 급격한 변화 감쇄
            const clampedPace = this.clampPaceChange(
                instantPace,
                this.emaPace,
                dtSec
            );
            // EMA 업데이트
            this.emaPace = this.emaPace + alpha * (clampedPace - this.emaPace);
        }

        this.sampleCount++;
        this.lastTimestamp = timestamp;

        return {
            currentPace: this.emaPace,
            isStable: this.sampleCount >= 5,
        };
    }

    /**
     * EMA 알파 계산
     * alpha = 1 - exp(-dt/tau)
     */
    private calculateAlpha(dtSec: number): number {
        return 1 - Math.exp(-dtSec / this.config.emaTauSec);
    }

    /**
     * 페이스 변화율 제한
     *
     * 급격한 페이스 변화를 제한하여 부드러운 전환
     */
    private clampPaceChange(
        newPace: number,
        currentPace: number,
        dtSec: number
    ): number {
        const maxChange = this.config.maxPaceChangePerSec * dtSec;
        const diff = newPace - currentPace;

        if (Math.abs(diff) > maxChange) {
            return currentPace + Math.sign(diff) * maxChange;
        }

        return newPace;
    }

    /**
     * 현재 EMA 페이스 반환
     */
    getCurrentPace(): number | null {
        return this.emaPace;
    }

    /**
     * 안정 상태 여부
     */
    isStable(): boolean {
        return this.sampleCount >= 5;
    }

    /**
     * 샘플 수 반환
     */
    getSampleCount(): number {
        return this.sampleCount;
    }

    /**
     * 계산기 상태 초기화
     */
    reset(): void {
        this.emaPace = null;
        this.sampleCount = 0;
        this.lastTimestamp = 0;
    }
}

/** 싱글톤 인스턴스 */
export const paceCalculator = new PaceCalculator();
