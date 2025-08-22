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
    private minAccuracy = 1; // 최소 측정 정확도 (1m) - 낮을 수록 측정이 믿을 수 있음
    private variance = -1; // 추정값의 분산 P
    private timestamp = 0; // 마지막 업데이트 시간
    private value = 0; // 현재 추정값

    private computeQ(speed: number): number {
        if (speed < 1 || Number.isNaN(speed)) return 1;

        return Math.pow(speed, 1.5);
    }

    process(
        mesuredValue: number,
        accuracy: number,
        timestamp: number,
        speed: number
    ): number {
        const dynamicQ = this.computeQ(speed);

        if (accuracy < this.minAccuracy) accuracy = this.minAccuracy;

        // 초기화 (최초 입력값으로 상태 세팅)
        if (this.variance < 0) {
            this.timestamp = timestamp;
            this.value = mesuredValue;
            this.variance = accuracy * accuracy;
            return this.value;
        }

        // 예측 단계: 시간 경과에 따른 분산 증가
        const timeDelta = timestamp - this.timestamp;
        if (timeDelta > 0) {
            this.variance += (timeDelta * dynamicQ * dynamicQ) / 1000;
            this.timestamp = timestamp;
        }

        // 예측과 측정 값 중 어느 값을 더 신뢰할 것인가?
        const K = this.variance / (this.variance + accuracy * accuracy);

        // 보정 단계: 측정값과 예측값을 결합하여 최적의 추정값 계산
        this.value += K * (mesuredValue - this.value);

        // 분산 업데이트
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

    /**
     * GPS 좌표 필터링
     * @param latitude 위도
     * @param longitude 경도
     * @param locationAccuracy 위치 정확도
     * @param timestamp 시간
     * @param speed 속도
     */
    process(
        latitude: number,
        longitude: number,
        locationAccuracy: number,
        timestamp: number,
        speed: number
    ) {
        const filteredLatitude = Number(
            this.latitudeKalmanFilter
                .process(latitude, locationAccuracy, timestamp, speed)
                .toFixed(6)
        );
        const filteredLongitude = Number(
            this.longitudeKalmanFilter
                .process(longitude, locationAccuracy, timestamp, speed)
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
