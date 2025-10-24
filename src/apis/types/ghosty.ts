interface VDOTRespose {
    valid: boolean;
    value: number;
}

interface GhostyRateLimitResponse {
    count: number;
}

type VDOTLevel = "ADVANCED" | "INTERMEDIATE" | "BEGINNER";
enum GhostyType {
    RECOVERY_JOGGING = "RECOVERY_JOGGING",
    STAMINA = "STAMINA",
    SPEED = "SPEED",
    MARATHON = "MARATHON",
    FREE = "FREE",
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
    processingStatus: "PROCESSING" | "SUCCEEDED" | "FAILED";
    pacemakerResponse: Pacemaker;
}

interface PacemakerByCourseIdResponse {
    processingStatus: "PROCESSING" | "SUCCEEDED" | "FAILED";
    pacemakerSummaryResponse: {
        id: number;
        pace: number;
    };
}

export type {
    CreateGhostyRequest,
    GhostyRateLimitResponse,
    Pacemaker,
    PacemakerByCourseIdResponse,
    PacemakerDetailResponse,
    RunSet,
    TimeTable,
    VDOTLevel,
    VDOTRespose,
};
