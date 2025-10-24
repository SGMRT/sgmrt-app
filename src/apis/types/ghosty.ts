interface VDOTRespose {
    valid: boolean;
    value: number;
}

interface GhostyRateLimitResponse {
    count: number;
}

enum VDOTLevel {
    ADVANCED = "상급자",
    INTERMEDIATE = "중급자",
    BEGINNER = "입문자",
}

enum GhostyType {
    RECOVERY_JOGGING = "감각을 찾는 회복 러닝",
    STAMINA = "꾸준히 달리며 체력 증진",
    SPEED = "속도를 높이고 한계에 도전",
    MARATHON = "긴 여정을 달리는 마라톤",
    FREE = "기분 가는 대로 달리기",
}

enum Condition {
    LEVEL_1 = 1,
    LEVEL_2 = 2,
    LEVEL_3 = 3,
    LEVEL_4 = 4,
    LEVEL_5 = 5,
}

interface CreateGhostyRequest {
    type: GhostyType;
    targetDistance: number; // km
    condition: Condition;
    temperature: number;
    courseId?: number;
}

type RunSet = {
    setNum: number;
    message: string;
    startPoint: number;
    endPoint: number;
    pace: number;
};

type TimeTable = {
    warmUpMinutes: number;
    maintenanceMinutes: number;
    coolDownMinutes: number;
};

type Pacemaker = {
    id: number;
    summary: string;
    norm: string;
    goalKm: number;
    expectedMinutes: number;
    initialMessage: string;
    pace: number;
    sets: RunSet[];
    timeTable: TimeTable;
};

interface PacemakerDetailResponse {
    processingStatus: "PROCEESSING" | "SUCCEEDED" | "FAILED";
    pacemakerResponse: Pacemaker;
}

interface PacemakerByCourseIdResponse {
    processingStatus: "PROCEEDING" | "COMPLETED" | "FAILED";
    pacemakerSummaryResponse: {
        id: number;
        pace: number;
    };
}

export {
    Condition,
    CreateGhostyRequest,
    GhostyRateLimitResponse,
    GhostyType,
    Pacemaker,
    PacemakerByCourseIdResponse,
    PacemakerDetailResponse,
    RunSet,
    TimeTable,
    VDOTLevel,
    VDOTRespose,
};
