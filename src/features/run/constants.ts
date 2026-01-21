export const LOCATION_TASK = "RUN_LOCATION_TASK" as const;

// GPS 정확도 및 필터링 상수
export const MAX_ACCURACY_METERS = 15;
export const MIN_DISPLACEMENT_METERS = 2.0; // 최소 변위 필터 (기존 1.0에서 증가)

// 센서 동기화 상수
export const MATCH_WINDOW_MS = 3000;

// 링 버퍼 크기
export const LOCATION_BUFFER_SIZE = 100;
export const PEDOMETER_BUFFER_SIZE = 100;
export const PRESSURE_BUFFER_SIZE = 100;
export const HEART_RATE_BUFFER_SIZE = 100;

// 이상치 탐지 상수
export const MAX_SPEED_MPS = 12; // 최대 속도 (기존 stats.ts의 15에서 감소)
export const MAX_ACCELERATION_MPS2 = 5; // 최대 가속도

// 페이스 계산 상수
export const PACE_WINDOW_MS = 15_000; // 페이스 윈도우 (기존 10초에서 15초로 증가)
export const STICKY_PACE_TIMEOUT_MS = 30_000; // Sticky 페이스 타임아웃
export const MIN_SAMPLES_FOR_PACE = 3; // 페이스 계산 최소 샘플 수

// GPS 업데이트 설정
export const GPS_DEFERRED_UPDATE_INTERVAL_MS = 1000; // GPS 업데이트 간격 (기존 3000에서 감소)
export const GPS_DISTANCE_INTERVAL_M = 5; // 거리 기반 업데이트 트리거
export const GPS_DEFERRED_DISTANCE_M = 3; // 최소 배치 거리

// 걸음수 기반 거리 보정 상수
export const DEFAULT_STRIDE_LENGTH_M = 1.0; // 기본 보폭 (m)
export const MIN_STRIDE_LENGTH_M = 0.5; // 최소 보폭 (걷기)
export const MAX_STRIDE_LENGTH_M = 1.5; // 최대 보폭 (Phase 5: 1.8→1.5로 조정)
export const STEP_DISTANCE_CORRECTION_THRESHOLD = 1.08; // GPS/걸음수 비율 임계값 (Phase 2: 1.15→1.08)
export const STEP_DISTANCE_MAX_CORRECTION_RATIO = 0.75; // 최대 25% 감소
export const STEP_DISTANCE_GPS_WEIGHT = 0.2; // 보정 시 GPS 가중치 (Phase 5: 0.3→0.2, 걸음수 더 신뢰)
