/**
 * GPS 이상치 탐지기
 *
 * 다단계 검증을 통해 GPS 측정값의 신뢰도를 평가합니다.
 * - GPS 정확도 체크
 * - 텔레포트 탐지 (순간이동)
 * - 속도 임계값 체크
 * - 가속도 체크
 * - 방향 일관성 체크
 */

import { haversineMeters } from "./haversineMeters";

export interface OutlierResult {
    isOutlier: boolean;
    reason?: "accuracy" | "teleport" | "speed" | "acceleration" | "heading";
    confidence: number; // 0-1, 높을수록 이상치일 가능성 높음
    adjustedAccuracy?: number; // 부분 신뢰 시 조정된 정확도
}

export interface LocationSample {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number | null;
    speed: number | null;
    course: number | null; // heading in degrees
}

interface DetectorConfig {
    maxAccuracyMeters: number;
    maxSpeedMps: number;
    maxAccelerationMps2: number;
    maxHeadingChangeDegPerSec: number;
    maxTeleportDistanceM: number;
    teleportTimeWindowMs: number;
    minSampleDtMs: number;
}

const DEFAULT_CONFIG: DetectorConfig = {
    maxAccuracyMeters: 15,
    maxSpeedMps: 12, // 12 m/s = 43.2 km/h (마라톤 세계 기록 수준)
    maxAccelerationMps2: 5, // 일반적인 러닝 최대 가속도
    maxHeadingChangeDegPerSec: 90, // 급격한 방향 전환 임계값
    maxTeleportDistanceM: 50, // 순간이동 감지 거리
    teleportTimeWindowMs: 2000, // 2초 내 텔레포트 감지
    minSampleDtMs: 500, // 최소 샘플 간격
};

export class OutlierDetector {
    private config: DetectorConfig;
    private prevSample: LocationSample | null = null;
    private prevSpeed: number = 0;

    constructor(config: Partial<DetectorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * GPS 샘플의 이상치 여부를 검사합니다.
     */
    check(current: LocationSample): OutlierResult {
        const prev = this.prevSample;

        // 첫 번째 샘플은 정확도만 체크
        if (!prev) {
            const accuracyResult = this.checkAccuracy(current);
            if (!accuracyResult.isOutlier) {
                this.prevSample = current;
            }
            return accuracyResult;
        }

        const dtMs = current.timestamp - prev.timestamp;
        const dtSec = dtMs / 1000;

        // 시간 간격이 너무 짧으면 스킵
        if (dtMs < this.config.minSampleDtMs) {
            return { isOutlier: false, confidence: 0 };
        }

        // 1. GPS 정확도 체크
        const accuracyResult = this.checkAccuracy(current);
        if (accuracyResult.isOutlier && accuracyResult.confidence > 0.8) {
            return accuracyResult;
        }

        // 거리 계산
        const distance = haversineMeters(
            prev.latitude,
            prev.longitude,
            current.latitude,
            current.longitude
        );

        // 2. 텔레포트 탐지
        const teleportResult = this.checkTeleport(distance, dtMs);
        if (teleportResult.isOutlier) {
            return teleportResult;
        }

        // 3. 속도 체크
        const calculatedSpeed = dtSec > 0 ? distance / dtSec : 0;
        const speedResult = this.checkSpeed(calculatedSpeed, current.speed);
        if (speedResult.isOutlier && speedResult.confidence > 0.7) {
            return speedResult;
        }

        // 4. 가속도 체크
        const accelerationResult = this.checkAcceleration(
            calculatedSpeed,
            dtSec
        );
        if (accelerationResult.isOutlier && accelerationResult.confidence > 0.7) {
            return accelerationResult;
        }

        // 5. 방향 일관성 체크
        const headingResult = this.checkHeadingConsistency(
            prev,
            current,
            dtSec
        );
        if (headingResult.isOutlier && headingResult.confidence > 0.8) {
            return headingResult;
        }

        // 이상치가 아니면 상태 업데이트
        this.prevSample = current;
        this.prevSpeed = calculatedSpeed;

        // 부분 신뢰 케이스: 정확도 조정
        if (accuracyResult.confidence > 0.3 || speedResult.confidence > 0.3) {
            const maxConfidence = Math.max(
                accuracyResult.confidence,
                speedResult.confidence
            );
            return {
                isOutlier: false,
                confidence: maxConfidence,
                adjustedAccuracy: (current.accuracy ?? 10) * (1 + maxConfidence),
            };
        }

        return { isOutlier: false, confidence: 0 };
    }

    private checkAccuracy(sample: LocationSample): OutlierResult {
        const accuracy = sample.accuracy;
        if (accuracy === null) {
            return { isOutlier: false, confidence: 0.3 }; // null은 약간의 불확실성
        }

        if (accuracy > this.config.maxAccuracyMeters) {
            const overRatio = accuracy / this.config.maxAccuracyMeters;
            const confidence = Math.min(1, 0.5 + overRatio * 0.25);
            return {
                isOutlier: true,
                reason: "accuracy",
                confidence,
            };
        }

        // 정확도가 좋지 않으면 부분 신뢰도 반환
        if (accuracy > this.config.maxAccuracyMeters * 0.7) {
            return {
                isOutlier: false,
                confidence: accuracy / this.config.maxAccuracyMeters - 0.5,
            };
        }

        return { isOutlier: false, confidence: 0 };
    }

    private checkTeleport(distanceM: number, dtMs: number): OutlierResult {
        if (
            distanceM > this.config.maxTeleportDistanceM &&
            dtMs < this.config.teleportTimeWindowMs
        ) {
            return {
                isOutlier: true,
                reason: "teleport",
                confidence: 0.95,
            };
        }
        return { isOutlier: false, confidence: 0 };
    }

    private checkSpeed(
        calculatedSpeed: number,
        gpsSpeed: number | null
    ): OutlierResult {
        // 계산된 속도 체크
        if (calculatedSpeed > this.config.maxSpeedMps) {
            const overRatio = calculatedSpeed / this.config.maxSpeedMps;
            return {
                isOutlier: true,
                reason: "speed",
                confidence: Math.min(1, 0.6 + overRatio * 0.2),
            };
        }

        // GPS 속도와 계산된 속도 비교 (큰 차이는 의심)
        if (gpsSpeed !== null && gpsSpeed >= 0) {
            const speedDiff = Math.abs(calculatedSpeed - gpsSpeed);
            if (speedDiff > 5) {
                // 5 m/s 이상 차이
                return {
                    isOutlier: false,
                    confidence: Math.min(1, speedDiff / 10),
                };
            }
        }

        return { isOutlier: false, confidence: 0 };
    }

    private checkAcceleration(
        currentSpeed: number,
        dtSec: number
    ): OutlierResult {
        if (dtSec <= 0) {
            return { isOutlier: false, confidence: 0 };
        }

        const acceleration = Math.abs(currentSpeed - this.prevSpeed) / dtSec;

        if (acceleration > this.config.maxAccelerationMps2) {
            const overRatio = acceleration / this.config.maxAccelerationMps2;
            return {
                isOutlier: true,
                reason: "acceleration",
                confidence: Math.min(1, 0.5 + overRatio * 0.25),
            };
        }

        return { isOutlier: false, confidence: 0 };
    }

    private checkHeadingConsistency(
        prev: LocationSample,
        current: LocationSample,
        dtSec: number
    ): OutlierResult {
        if (
            prev.course === null ||
            current.course === null ||
            dtSec <= 0
        ) {
            return { isOutlier: false, confidence: 0 };
        }

        // 방향 변화 계산 (0-180도 범위로 정규화)
        let headingChange = Math.abs(current.course - prev.course);
        if (headingChange > 180) {
            headingChange = 360 - headingChange;
        }

        const headingChangeRate = headingChange / dtSec;

        if (headingChangeRate > this.config.maxHeadingChangeDegPerSec) {
            const overRatio =
                headingChangeRate / this.config.maxHeadingChangeDegPerSec;
            return {
                isOutlier: true,
                reason: "heading",
                confidence: Math.min(1, 0.5 + overRatio * 0.25),
            };
        }

        return { isOutlier: false, confidence: 0 };
    }

    /**
     * 탐지기 상태 초기화
     */
    reset(): void {
        this.prevSample = null;
        this.prevSpeed = 0;
    }
}

export const outlierDetector = new OutlierDetector();
