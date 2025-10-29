type VoiceChannel = "NAV" | "RUN" | "GHOST" | "GHOSTY" | "CUSTOM";

export type VoiceMessage = {
    id: string;
    channel: VoiceChannel;
    text: string; // 최종 발화 텍스트
    ssml?: string; // SSML
    priority: number; // 0~100 (높을수록 시급)
    createdAtMs?: number;

    // 제어 옵션
    expiresAt?: number; // 만료시각(ms)
    dedupeKey?: string;
    throttleMs?: number;
    maxDurationMs?: number; // 길이 제한 (예상 발화시간 기준)
    canBarge?: boolean; // 바지(끼어들기)
    interruptLower?: boolean; // 자신보다 낮은 우선순위 인터럽트
    lockChannel?: boolean; // 같은 채널 락 (중복 안내 방지)

    // 콜백
    onStart?: () => void;
    onEnd?: (reason: "done" | "expired" | "interrupted") => void;
};

export const VoicePresets = {
    NAV: {
        priority: 90,
        canBarge: true,
        interruptLower: true,
        lockChannel: true,
        expiresMs: 2000,
        decayPerSec: 25,
    },
};
