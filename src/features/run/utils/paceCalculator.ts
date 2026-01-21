/**
 * 페이스 계산기
 *
 * 개선된 페이스 계산 알고리즘:
 * - 15초 롤링 윈도우 (기존 10초에서 증가)
 * - 이상치 제거 (상/하위 10% 제거)
 * - 가중 평균 (최근 샘플에 높은 가중치)
 * - Sticky 타임아웃 (30초 후 초기화)
 */

interface PaceSample {
    timestamp: number;
    distanceM: number;
    dtSec: number;
}

interface PaceConfig {
    windowMs: number;
    minSamplesForPace: number;
    outlierPercentile: number;
    stickyTimeoutMs: number;
    useWeightedAverage: boolean;
}

const DEFAULT_CONFIG: PaceConfig = {
    windowMs: 15_000, // 15초 윈도우 (기존 10초)
    minSamplesForPace: 3, // 최소 3개 샘플
    outlierPercentile: 0.1, // 상/하위 10% 제거
    stickyTimeoutMs: 30_000, // 30초 후 sticky 초기화
    useWeightedAverage: true, // 가중 평균 사용
};

export class PaceCalculator {
    private config: PaceConfig;
    private window: PaceSample[] = [];
    private lastValidPace: number | null = null;
    private lastValidPaceTs: number = 0;

    constructor(config: Partial<PaceConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 새 샘플을 추가하고 현재 페이스를 반환합니다.
     * @param timestamp 타임스탬프 (ms)
     * @param distanceM 거리 변화량 (m)
     * @param dtSec 시간 변화량 (초)
     * @returns 현재 페이스 (초/km) 또는 null
     */
    addSample(
        timestamp: number,
        distanceM: number,
        dtSec: number
    ): number | null {
        // 유효한 샘플만 추가
        if (distanceM > 0 && dtSec > 0) {
            this.window.push({ timestamp, distanceM, dtSec });
        }

        // 윈도우 슬라이드
        const cutoff = timestamp - this.config.windowMs;
        this.window = this.window.filter((s) => s.timestamp >= cutoff);

        // 최소 샘플 수 확인
        if (this.window.length < this.config.minSamplesForPace) {
            return this.getStickyPace(timestamp);
        }

        // 이상치 제거 후 페이스 계산
        const pace = this.calculateWithOutlierRemoval();

        if (pace !== null && pace > 0) {
            this.lastValidPace = pace;
            this.lastValidPaceTs = timestamp;
            return pace;
        }

        return this.getStickyPace(timestamp);
    }

    /**
     * 이상치를 제거하고 페이스를 계산합니다.
     */
    private calculateWithOutlierRemoval(): number | null {
        // 각 세그먼트의 페이스 계산
        const segmentPaces = this.window
            .filter((s) => s.distanceM > 0 && s.dtSec > 0)
            .map((s) => {
                const speedMps = s.distanceM / s.dtSec;
                return {
                    pace: speedMps > 0 ? 1000 / speedMps : Infinity,
                    timestamp: s.timestamp,
                };
            })
            .filter((p) => isFinite(p.pace) && p.pace > 0);

        if (segmentPaces.length < 2) {
            return null;
        }

        // 이상치 제거 (상/하위 percentile 제거)
        const sortedPaces = [...segmentPaces].sort((a, b) => a.pace - b.pace);
        const trimCount = Math.floor(
            sortedPaces.length * this.config.outlierPercentile
        );
        const trimmedPaces = sortedPaces.slice(
            trimCount,
            sortedPaces.length - Math.max(trimCount, 1)
        );

        if (trimmedPaces.length === 0) {
            return null;
        }

        // 가중 평균 또는 단순 평균
        if (this.config.useWeightedAverage) {
            return this.calculateWeightedAverage(trimmedPaces);
        }

        const sum = trimmedPaces.reduce((acc, p) => acc + p.pace, 0);
        return sum / trimmedPaces.length;
    }

    /**
     * 시간 기반 가중 평균을 계산합니다.
     * 최근 샘플에 더 높은 가중치를 부여합니다.
     */
    private calculateWeightedAverage(
        paces: { pace: number; timestamp: number }[]
    ): number {
        if (paces.length === 0) return 0;

        const now = paces[paces.length - 1].timestamp;
        const windowMs = this.config.windowMs;

        let weightedSum = 0;
        let totalWeight = 0;

        for (const p of paces) {
            // 최근일수록 가중치가 높음 (0.5 ~ 1.0 범위)
            const age = now - p.timestamp;
            const weight = 0.5 + 0.5 * (1 - age / windowMs);

            weightedSum += p.pace * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Sticky 페이스를 반환합니다.
     * 타임아웃이 지나면 null을 반환합니다.
     */
    private getStickyPace(currentTs: number): number | null {
        if (this.lastValidPace === null) {
            return null;
        }

        // 타임아웃 체크
        if (currentTs - this.lastValidPaceTs > this.config.stickyTimeoutMs) {
            this.lastValidPace = null;
            return null;
        }

        return this.lastValidPace;
    }

    /**
     * 평균 페이스를 계산합니다 (전체 거리/전체 시간 기반).
     */
    calculateAveragePace(totalDistanceM: number, totalTimeSec: number): number | null {
        if (totalDistanceM <= 0 || totalTimeSec <= 0) {
            return null;
        }

        const speedMps = totalDistanceM / totalTimeSec;
        if (speedMps <= 0) {
            return null;
        }

        return 1000 / speedMps; // 초/km
    }

    /**
     * 계산기 상태를 초기화합니다.
     */
    reset(): void {
        this.window = [];
        this.lastValidPace = null;
        this.lastValidPaceTs = 0;
    }

    /**
     * 현재 윈도우 크기를 반환합니다.
     */
    getWindowSize(): number {
        return this.window.length;
    }
}

export const paceCalculator = new PaceCalculator();
