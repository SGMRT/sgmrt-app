/**
 * 1D Kalman Filter with Velocity Model
 *
 * 상태 벡터: [위치, 속도]
 * 측정값과 예측값을 결합하여 최적의 추정값을 계산
 *
 * 예측 단계:
 * x_predict = x_prev + v_prev * dt
 * v_predict = v_prev
 * P_predict = F * P * F^T + Q
 *
 * 보정 단계:
 * K = P_predict * H^T / (H * P_predict * H^T + R)
 * x_update = x_predict + K * (z - H * x_predict)
 * P_update = (I - K * H) * P_predict
 *
 * 변수 설명
 * x: 현재 위치 추정값
 * v: 현재 속도 추정값 (도/초)
 * P: 추정값의 불확실성 (2x2 공분산 행렬)
 * Q: 시스템 예측의 불확실성 (움직임이 클 수록 증가)
 * R: 측정값의 불확실성 (여기서는 GPS의 accuracy를 사용)
 * K: Kalman Gain (측정값과 예측값의 가중치)
 * z: 새로 들어온 측정값 (GPS 위치 데이터)
 */

export class KalmanFilter1D {
    private minAccuracy = 1e-7; // 최소 측정 정확도 '도' 기준
    private position = 0; // 현재 위치 추정값
    private velocity = 0; // 현재 속도 추정값 (도/초)
    private P: [number, number, number, number] = [0, 0, 0, 0]; // 2x2 공분산 행렬 [P00, P01, P10, P11]
    private timestamp = 0; // 마지막 업데이트 시간
    private initialized = false;

    // 튜닝 파라미터 (개선됨)
    private WARMUP_MS = 5000; // 시작 5초간 부스트 (기존 3초)
    private INIT_P_MULTIPLIER = 30; // 초기 P를 크게 (기존 50에서 감소)
    private BASE_Q_POSITION = 1e-8; // 위치 공정잡음 (기존 1e-9에서 증가)
    private BASE_Q_VELOCITY = 1e-6; // 속도 공정잡음 (신규)
    private SPEED_Q_GAIN = 5e-8; // 속도에 따른 Q 증가량 계수
    private lastStartTs = 0;

    private computeQ(
        speedMps: number,
        nowMs: number
    ): { qPos: number; qVel: number } {
        // 초반 워밍업에선 Q를 강하게
        const warmupBoost = nowMs - this.lastStartTs < this.WARMUP_MS ? 20 : 1;
        // 속도가 빠를수록 Q 증가(선형 ~ 약간의 초과 증가)
        const speedFactor = Math.pow(Math.max(0, speedMps), 1.2);

        return {
            qPos:
                (this.BASE_Q_POSITION + this.SPEED_Q_GAIN * speedFactor) *
                warmupBoost,
            qVel: this.BASE_Q_VELOCITY * warmupBoost,
        };
    }

    process(
        measuredDeg: number,
        accuracyDeg: number,
        timestampMs: number,
        speedMps: number
    ): number {
        if (accuracyDeg < this.minAccuracy) accuracyDeg = this.minAccuracy;

        // 초기화
        if (!this.initialized) {
            this.timestamp = timestampMs;
            this.lastStartTs = timestampMs;
            this.position = measuredDeg;
            this.velocity = 0;
            // 초기 공분산 행렬
            const initVar = accuracyDeg * accuracyDeg * this.INIT_P_MULTIPLIER;
            this.P = [initVar, 0, 0, initVar * 0.1]; // 속도 불확실성은 위치보다 작게
            this.initialized = true;
            return this.position;
        }

        const dtMs = timestampMs - this.timestamp;
        if (dtMs <= 0) {
            return this.position;
        }

        const dtSec = dtMs / 1000;
        this.timestamp = timestampMs;

        // === 예측 단계 ===
        // 상태 예측: x = x + v*dt, v = v
        const predictedPos = this.position + this.velocity * dtSec;
        const predictedVel = this.velocity;

        // 공분산 예측: P = F * P * F^T + Q
        // F = [[1, dt], [0, 1]]
        const { qPos, qVel } = this.computeQ(speedMps, timestampMs);
        const [P00, P01, P10, P11] = this.P;

        // F * P * F^T 계산
        const predictedP00 =
            P00 + dtSec * (P01 + P10) + dtSec * dtSec * P11 + qPos;
        const predictedP01 = P01 + dtSec * P11;
        const predictedP10 = P10 + dtSec * P11;
        const predictedP11 = P11 + qVel;

        // === 보정 단계 ===
        // H = [1, 0] (위치만 측정)
        const R = accuracyDeg * accuracyDeg;

        // K = P * H^T / (H * P * H^T + R)
        const S = predictedP00 + R; // 혁신 공분산
        const K0 = predictedP00 / S; // 위치에 대한 칼만 게인
        const K1 = predictedP10 / S; // 속도에 대한 칼만 게인

        // 혁신 (측정값 - 예측값)
        const innovation = measuredDeg - predictedPos;

        // 상태 업데이트
        this.position = predictedPos + K0 * innovation;
        this.velocity = predictedVel + K1 * innovation;

        // 공분산 업데이트: P = (I - K*H) * P
        this.P = [
            (1 - K0) * predictedP00,
            (1 - K0) * predictedP01,
            -K1 * predictedP00 + predictedP10,
            -K1 * predictedP01 + predictedP11,
        ];

        return this.position;
    }

    getEstimate(): number {
        return this.position;
    }

    getVelocity(): number {
        return this.velocity;
    }

    reset(): void {
        this.position = 0;
        this.velocity = 0;
        this.P = [0, 0, 0, 0];
        this.timestamp = 0;
        this.initialized = false;
    }
}

/** 위도, 경도, 고도 칼만 필터 */
class KalmanFilter2D {
    private latitudeKalmanFilter = new KalmanFilter1D();
    private longitudeKalmanFilter = new KalmanFilter1D();

    private static metersToLatDeg(m: number) {
        // 1 deg lat ≈ 111,320 m
        return m / 111_320;
    }

    // 경도는 위도에 따라 "수평으로 퍼지는 거리"가 다름
    private static metersToLonDeg(m: number, latDeg: number) {
        // 1 deg lon ≈ 111,320 * cos(lat) m
        const cosLat = Math.max(0.000001, Math.cos((latDeg * Math.PI) / 180));
        return m / (111_320 * cosLat);
    }

    /**
     * GPS 좌표 필터링
     * @param latitude 위도
     * @param longitude 경도
     * @param locationAccuracyM 위치 정확도(오차 범위)
     * @param timestamp 시간
     * @param speed 속도
     */
    process(
        latitude: number,
        longitude: number,
        locationAccuracyM: number,
        timestamp: number,
        speed: number
    ) {
        const accLatDeg = KalmanFilter2D.metersToLatDeg(locationAccuracyM);
        const accLonDeg = KalmanFilter2D.metersToLonDeg(
            locationAccuracyM,
            latitude
        );

        // toFixed(6) 제거 - 전체 정밀도 유지
        const filteredLatitude = this.latitudeKalmanFilter.process(
            latitude,
            accLatDeg,
            timestamp,
            speed
        );
        const filteredLongitude = this.longitudeKalmanFilter.process(
            longitude,
            accLonDeg,
            timestamp,
            speed
        );

        return {
            latitude: filteredLatitude,
            longitude: filteredLongitude,
        };
    }

    getEstimate() {
        return {
            latitude: this.latitudeKalmanFilter.getEstimate(),
            longitude: this.longitudeKalmanFilter.getEstimate(),
        };
    }

    reset() {
        this.latitudeKalmanFilter.reset();
        this.longitudeKalmanFilter.reset();
    }
}

export const geoFilter = new KalmanFilter2D();
