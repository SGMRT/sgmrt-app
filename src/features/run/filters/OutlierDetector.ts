/**
 * GPS 이상치 감지기
 *
 * 칼만 필터 이전에 명백한 GPS 스파이크를 제거합니다.
 * - 정확도 기반 필터
 * - 속도 기반 필터
 * - 가속도 기반 필터
 * - 점프 거리 필터
 */

import { haversineMeters } from "../utils/haversineMeters";
import { OUTLIER_CONFIG } from "./config";
import type { GpsPoint, OutlierConfig, OutlierResult } from "./types";

interface HistoryPoint {
    latitude: number;
    longitude: number;
    timestamp: number;
    speed: number;
}

export class OutlierDetector {
    private readonly config: OutlierConfig;
    private readonly history: HistoryPoint[] = [];
    private readonly HISTORY_SIZE = 5;
    private consecutiveRejects = 0;
    /** 이동 필터에 연속 거부되면 현재 포인트를 새 앵커로 수용 (데드엔드 방지) */
    private readonly REANCHOR_AFTER = 3;

    constructor(config: OutlierConfig = OUTLIER_CONFIG) {
        this.config = config;
    }

    /**
     * GPS 포인트가 이상치인지 감지
     */
    detect(point: GpsPoint): OutlierResult {
        const { latitude, longitude, accuracy, timestamp, speed } = point;

        // 1. 정확도 기반 필터
        if (accuracy != null && accuracy > this.config.minAccuracyM) {
            return {
                isOutlier: true,
                reason: "accuracy",
                confidence: 0,
            };
        }

        // 이전 포인트가 없으면 유효로 처리
        if (this.history.length === 0) {
            this.addToHistory(point);
            return {
                isOutlier: false,
                confidence: this.calculateConfidence(accuracy),
            };
        }

        const lastPoint = this.history[this.history.length - 1];
        const dtSec = (timestamp - lastPoint.timestamp) / 1000;

        // 시간 차이가 너무 작으면 스킵 (중복 샘플)
        if (dtSec <= 0) {
            return {
                isOutlier: false,
                confidence: this.calculateConfidence(accuracy),
            };
        }

        // 2. 점프 거리 필터
        // 신호 유실(터널/다리) 동안의 정상 이동을 거부하지 않도록
        // 경과 시간 기준 최대 이동 가능 거리와 비교
        const jumpDist = haversineMeters(
            lastPoint.latitude,
            lastPoint.longitude,
            latitude,
            longitude
        );
        const maxPlausibleJumpM = Math.max(
            this.config.maxJumpM,
            this.config.maxSpeedMps * dtSec
        );

        if (jumpDist > maxPlausibleJumpM) {
            return this.rejectOrReanchor(point, "jump");
        }

        // 3. 속도 기반 필터
        const calculatedSpeed = jumpDist / dtSec;
        if (calculatedSpeed > this.config.maxSpeedMps) {
            return this.rejectOrReanchor(point, "speed");
        }

        // 4. 가속도 기반 필터
        const speedChange = Math.abs(calculatedSpeed - lastPoint.speed);
        const acceleration = dtSec > 0 ? speedChange / dtSec : 0;

        if (acceleration > this.config.maxAccelerationMps2) {
            return this.rejectOrReanchor(point, "acceleration");
        }

        // 유효한 포인트
        this.consecutiveRejects = 0;
        this.addToHistory({
            latitude,
            longitude,
            accuracy,
            timestamp,
            speed: speed ?? calculatedSpeed,
            course: point.course,
        });

        return {
            isOutlier: false,
            confidence: this.calculateConfidence(accuracy),
        };
    }

    /**
     * 이동 필터 거부 처리
     *
     * 연속 거부가 임계값에 도달하면 현재 포인트를 새 앵커로 수용한다.
     * 앵커가 갱신되지 않은 채 모든 포인트가 영구 거부되는
     * 데드엔드(거리 측정 정지)를 방지한다.
     * 정확도 거부는 카운터에 포함하지 않는다 (나쁜 픽스가 앵커가 되면 안됨).
     */
    private rejectOrReanchor(
        point: GpsPoint,
        reason: "jump" | "speed" | "acceleration"
    ): OutlierResult {
        this.consecutiveRejects++;

        if (this.consecutiveRejects >= this.REANCHOR_AFTER) {
            this.consecutiveRejects = 0;
            this.history.length = 0;
            this.addToHistory(point);
            return {
                isOutlier: false,
                reanchored: true,
                confidence: this.calculateConfidence(point.accuracy),
            };
        }

        return {
            isOutlier: true,
            reason,
            confidence: 0,
        };
    }

    /**
     * GPS 정확도 기반 신뢰도 계산
     * 정확도가 좋을수록 신뢰도가 높음
     */
    private calculateConfidence(accuracy: number | null): number {
        if (accuracy == null) {
            return 0.5; // 정확도 정보 없으면 중간값
        }
        // 정확도 1m → 1.0, 정확도 20m → 0.0
        const confidence = Math.max(
            0,
            1 - accuracy / this.config.minAccuracyM
        );
        return Math.min(1, confidence);
    }

    /**
     * 히스토리에 포인트 추가
     */
    private addToHistory(point: GpsPoint): void {
        this.history.push({
            latitude: point.latitude,
            longitude: point.longitude,
            timestamp: point.timestamp,
            speed: point.speed ?? 0,
        });

        // 히스토리 크기 유지
        while (this.history.length > this.HISTORY_SIZE) {
            this.history.shift();
        }
    }

    /**
     * 이전 포인트들의 평균 속도 계산
     */
    getAverageSpeed(): number {
        if (this.history.length < 2) {
            return 0;
        }

        let totalSpeed = 0;
        for (let i = 1; i < this.history.length; i++) {
            const prev = this.history[i - 1];
            const curr = this.history[i];
            const dist = haversineMeters(
                prev.latitude,
                prev.longitude,
                curr.latitude,
                curr.longitude
            );
            const dt = (curr.timestamp - prev.timestamp) / 1000;
            if (dt > 0) {
                totalSpeed += dist / dt;
            }
        }

        return totalSpeed / (this.history.length - 1);
    }

    /**
     * 필터 상태 초기화
     */
    reset(): void {
        this.history.length = 0;
        this.consecutiveRejects = 0;
    }

    /**
     * 마지막 유효 포인트 반환
     */
    getLastValidPoint(): HistoryPoint | null {
        return this.history.length > 0
            ? this.history[this.history.length - 1]
            : null;
    }
}

/** 싱글톤 인스턴스 */
export const outlierDetector = new OutlierDetector();
