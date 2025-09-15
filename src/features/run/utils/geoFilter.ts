/**
 * 1D Kalman Filter
 *
 * 측정값과 예측값을 결합하여 최적의 추정값을 계산
 *
 * 예측 단계:
 * x_predict= x_prev
 * P_predict = P_prev + Q
 *
 * 보정 단계:
 * K = P_predict / (P_predict + R)
 * x_update = x_predict + K * (z - x_predict)
 * P_update = (1 - K) * P_predict
 *
 * 변수 설명
 * x: 현재 추정값
 * P: 추정값의 불확실성(분산)
 * Q: 시스템 예측의 불확실성 (움직임이 클 수록 증가)
 * R: 측정값의 불확실성 (여기서는 GPS의 accuracy를 사용)
 * K: Kalman Gain (측정값과 예측값의 가중치)
 * z: 새로 들어온 측정값 (GPS 위치 데이터)
 */

export class KalmanFilter1D {
    private minAccuracy = 1e-7; // 최소 측정 정확도 '도' 기준
    private variance = -1; // 추정값의 분산 P
    private timestamp = 0; // 마지막 업데이트 시간
    private value = 0; // 현재 추정값

    // 튜닝 파라미터
    private WARMUP_MS = 3000; // 시작 3초간 부스트
    private INIT_P_MULTIPLIER = 50; // 초기 P를 크게 → 측정을 더 빨리 신뢰
    private BASE_Q = 1e-9; // 도^2 / s 기준의 베이스 공정잡음 (아주 작게)
    private SPEED_Q_GAIN = 5e-8; // 속도에 따른 Q 증가량 계수
    private lastStartTs = 0;

    private computeQ(speedMps: number, nowMs: number): number {
        // 초반 워밍업에선 Q를 강하게
        const warmupBoost = nowMs - this.lastStartTs < this.WARMUP_MS ? 50 : 1;
        // 속도가 빠를수록 Q 증가(선형 ~ 약간의 초과 증가)
        const dynamic =
            this.BASE_Q +
            this.SPEED_Q_GAIN * Math.pow(Math.max(0, speedMps), 1.2);
        return dynamic * warmupBoost;
    }

    process(
        measuredDeg: number,
        accuracyDeg: number,
        timestampMs: number,
        speedMps: number
    ): number {
        if (accuracyDeg < this.minAccuracy) accuracyDeg = this.minAccuracy;

        // 초기화
        if (this.variance < 0) {
            this.timestamp = timestampMs;
            this.lastStartTs = timestampMs;
            this.value = measuredDeg;
            // 초기 분산을 크게 → 초기 K ≈ 1에 가깝게 만들어 첫 구간 민첩
            this.variance = accuracyDeg * accuracyDeg * this.INIT_P_MULTIPLIER;
            return this.value;
        }

        // 예측 단계 (시간 단위: s로 변환)
        const dtMs = timestampMs - this.timestamp;
        if (dtMs > 0) {
            const dtSec = dtMs / 1000;
            const Q = this.computeQ(speedMps, timestampMs);
            // P = P + Q*dt
            this.variance += Q * dtSec;
            this.timestamp = timestampMs;
        }

        // 칼만 게인
        const R = accuracyDeg * accuracyDeg;
        const K = this.variance / (this.variance + R);

        // 업데이트
        this.value += K * (measuredDeg - this.value);
        this.variance = (1 - K) * this.variance;

        return this.value;
    }

    getEstimate(): number {
        return this.value;
    }
    reset() {
        this.variance = -1;
        this.timestamp = 0;
        this.value = 0;
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

        const filteredLatitude = Number(
            this.latitudeKalmanFilter
                .process(latitude, accLatDeg, timestamp, speed)
                .toFixed(6)
        );
        const filteredLongitude = Number(
            this.longitudeKalmanFilter
                .process(longitude, accLonDeg, timestamp, speed)
                .toFixed(6)
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
