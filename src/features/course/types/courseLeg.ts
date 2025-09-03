import { Checkpoint } from "@/src/apis/types/course";
import { Telemetry } from "@/src/apis/types/run";

export type CourseLeg = {
    index: number;
    start: Checkpoint;
    end: Checkpoint;
    legDistance: number; // (m)
    cumDistance: number; // (m) 코스 시작~현재 레그 끝
    points: Telemetry[]; // [startIdx..endIdx] 포함
};
