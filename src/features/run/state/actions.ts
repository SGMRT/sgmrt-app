import { RawRunData, RunMode } from "../types";
import { CourseVariant } from "../types/status";

export type RunAction =
    | {
          type: "START";
          payload: {
              sessionId: string;
              mode: RunMode;
              variant?: CourseVariant;
          };
      } // 러닝 시작
    | { type: "READY" } // 코스 러닝 대기
    | { type: "PAUSE_USER" } // 유저에 의한 일시정지
    | { type: "OFFCOURSE" } // 코스 이탈로 일시정지
    | { type: "ONCOURSE" } // 코스 복귀
    | { type: "RESUME" } // 일시정지 해제 후 재개
    | { type: "COMPLETE" } // 완주 -> 보류 상태
    | { type: "EXTEND" } // 완주 이후 계속 달리기 대기
    | { type: "STOP" } // 최종 종료
    | { type: "RESET" } // 초기화
    | { type: "ACCEPT_SAMPLE"; payload: { sample: RawRunData } }; // 샘플 받아서 버퍼에 추가
