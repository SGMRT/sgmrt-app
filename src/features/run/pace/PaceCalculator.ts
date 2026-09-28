/**
 * 윈도우 합산 기반 페이스 계산기
 *
 * 최근 윈도우(기본 10초)의 거리 합/시간 합으로 페이스를 계산한다.
 *
 * 샘플별 순간 페이스(시간/거리)를 EMA로 평균하면 노이즈 낀 거리의
 * 역수가 평균적으로 위로 편향되어(Jensen 부등식) 페이스가 실제보다
 * 느리게 표시된다 (σ=2m 노이즈 기준 약 +8%). 합산 후 나누기는
 * 이 편향이 없다.
 */

import { PACE_CONFIG } from "../filters/config";
import type { PaceConfig, PaceResult } from "../filters/types";

interface WindowEntry {
    distanceM: number;
    timeMs: number;
    /** 구간 종료 시각 (ms) */
    timestamp: number;
}

export class PaceCalculator {
    private readonly config: PaceConfig;
    private readonly window: WindowEntry[] = [];
    private lastPace: number | null = null;
    private sampleCount = 0;

    constructor(config: PaceConfig = PACE_CONFIG) {
        this.config = config;
    }

    /**
     * 윈도우 합산 페이스 계산
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
            return this.currentResult();
        }

        // 순간 페이스 (초/km) = ms/m
        const instantPace = timeDeltaMs / distanceDelta;

        // 이상치 거부 (윈도우 오염 방지)
        if (instantPace > this.config.outlierPaceThreshold) {
            return this.currentResult();
        }
        if (instantPace < this.config.minPaceSecPerKm) {
            return this.currentResult();
        }

        const windowMs = this.config.windowSec * 1000;

        // 윈도우보다 긴 갭(터널/일시정지 재개)은 이전 창을 비우고 새로 시작
        if (timeDeltaMs > windowMs) {
            this.window.length = 0;
        }

        this.window.push({
            distanceM: distanceDelta,
            timeMs: timeDeltaMs,
            timestamp,
        });

        // 윈도우 범위를 벗어난 구간 제거 (방금 push한 항목은 항상 남음)
        const cutoff = timestamp - windowMs;
        while (this.window[0].timestamp < cutoff) {
            this.window.shift();
        }

        let sumDistM = 0;
        let sumTimeMs = 0;
        for (const entry of this.window) {
            sumDistM += entry.distanceM;
            sumTimeMs += entry.timeMs;
        }

        // ms/m == 초/km
        this.lastPace = sumTimeMs / sumDistM;
        this.sampleCount++;

        return this.currentResult();
    }

    private currentResult(): PaceResult {
        return {
            currentPace: this.lastPace,
            isStable: this.sampleCount >= 5,
        };
    }

    /**
     * 현재 페이스 반환
     */
    getCurrentPace(): number | null {
        return this.lastPace;
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
        this.window.length = 0;
        this.lastPace = null;
        this.sampleCount = 0;
    }
}

/** 싱글톤 인스턴스 */
export const paceCalculator = new PaceCalculator();
