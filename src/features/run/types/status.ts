export type RunMode = "SOLO" | "COURSE";
export type CourseVariant = "PLAIN" | "GHOST";

export type RunStatus =
    | "IDLE" // 아무것도 안 하는 상태
    | "READY" // 시작 준비 상태 (코스일 때만)
    | "RUNNING" // 정상 달리는 중
    | "PAUSED_USER" // 유저가 일시정지
    | "PAUSED_OFFCOURSE" // 코스 이탈로 일시정지
    | "COMPLETION_PENDING" // 코스 완주했지만 저장/계속 대기
    | "RUNNING_EXTENDED" // 완주 이후 계속 뛰는 중
    | "STOPPED"; // 최종 종료
