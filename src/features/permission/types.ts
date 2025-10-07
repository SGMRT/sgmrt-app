export type PermissionGroup =
    | "LOCATION" // 위치(FG) — 필요시 BG는 별도 그룹으로 확장 가능
    | "SENSORS" // 러닝 필수: Pedometer + Barometer
    | "HEALTHKIT" // 러닝 선택: iOS HealthKit
    | "ADS" // iOS ATT (광고 추적)
    | "WATCH"; // 워치 네이티브 권한

export type PermissionCheck = {
    ok: boolean;
    missing: string[];
    details?: Record<string, any>;
};

export type PermissionRequestResult = PermissionCheck & {
    requested: boolean;
};
