export type Channel = "RUN" | "NAV" | "GHOST" | "PACER" | "CUSTOM";
export type Priority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export const P: Record<Priority, number> = {
    CRITICAL: 10,
    HIGH: 8,
    NORMAL: 5,
    LOW: 3,
};
export type NavKind = "APPROACH" | "KEEP";

export type Event =
    | { type: "nav/enter-leg"; meters: number; legIndex: number }
    | {
          type: "nav/approach-leg";
          meters: number;
          angle?: number | null;
          legIndex: number;
      }
    | { type: "nav/end-approach-alert"; meters: number; legIndex: number }
    | { type: "run/start"; mode: "SOLO" | "COURSE" | "GHOST" }
    | { type: "run/pause"; reason: "user" | "offcourse" }
    | { type: "run/resume" }
    | { type: "run/extend" }
    | {
          type: "run/complete";
          totalTime: number;
          totalDistance: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | {
          type: "run/stop";
          totalTime: number;
          totalDistance: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | { type: "run/offcourse-warning" }
    | {
          type: "run/distance";
          distanceKM: string;
          totalTime: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | { type: "ghost/change-leader"; leader: "ME" | "GHOST"; deltaM: number }
    | {
          type: "ghost/periodic";
          leader: "ME" | "GHOST" | "TIED";
          deltaM: number;
          progressM: number;
      }
    | { type: "ghosty"; message: string }
    | { type: "pacer/script"; script: string; priority?: Priority }
    | {
          type: "custom";
          text: string;
          priority?: Priority;
          cooldownKey?: string;
      };

export type Utterance = {
    id: string;
    channel: Channel;
    text: string;
    priority: Priority;
    atomic: boolean;
    interruptLower: boolean;
    canBarge: boolean;
    navKind?: NavKind;
    runKind?: "START";
    groupId?: string;
    cooldownKey?: string;
    expireAt?: number;
    hardCut?: boolean;
};

export type Settings = {
    enabled: boolean;
    lang: string;
    rate: number;
    cooldownMs: Record<string, number>;
};

export interface TTSEngine {
    speak(
        text: string,
        opts: {
            lang: string;
            rate: number;
            onDone: () => void;
            onStopped: () => void;
            onError: (e: any) => void;
        }
    ): void;
    stop(): void;
    enableDuck(): Promise<void>;
    disableDuck(): Promise<void>;
}
