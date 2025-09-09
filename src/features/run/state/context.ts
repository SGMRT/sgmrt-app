import { MessageType } from "@/modules/expo-live-activity";
import { Telemetry } from "@/src/apis/types/run";
import { RawRunData, RunMode } from "../types";
import { CourseMetadata, CourseVariant, RunStatus } from "../types/status";
import { SegmentMeta } from "./segments";
import { RunningStats } from "./stats";

export interface LiveActivityState {
    startedAtMs: number | null;
    pausedAtMs: number | null;
    message: string | null;
    messageType: MessageType | null;
}

export interface RunContext {
    sessionId: string | null;
    mode: RunMode;
    variant?: CourseVariant;
    courseMetadata?: CourseMetadata;
    status: RunStatus;

    mainTimeline: RawRunData[]; // 러닝 중 기록 된 데이터
    pausedBuffer: RawRunData[]; // 유저에 의한 일시정지 버퍼 (재시작 시 기록된 데이터 mainTimeline에 추가)
    mutedBuffer: RawRunData[]; // 코스 이탈 시 기록 안 된 데이터 (현재는 복귀 시 기록된 데이터 삭제)
    postCompleteBuffer: RawRunData[]; // 완주 후 기록 된 데이터 (완주 후 계속 러닝 대기 상태, 계속 러닝 시 기록된 데이터 mainTimeline에 추가)

    stats: RunningStats;
    telemetries: Telemetry[];
    segments: SegmentMeta[];
    liveActivity: LiveActivityState;

    _zeroNextDt: boolean;
}
