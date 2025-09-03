import { useAuthStore } from "@/src/store/authState";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import * as Sentry from "@sentry/react-native";
import * as Speech from "expo-speech";
import { initAudioModule } from "../bootstrap/useBootstrapApp";
export type VoicePriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type VoiceEvent =
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
    | {
          type: "run/complete";
          totalTime: number;
          totalDistance: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | { type: "run/extend" }
    | {
          type: "run/stop";
          totalTime: number;
          totalDistance: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | { type: "run/offcourse-warning" }
    | {
          type: "run/ghost-change-leader";
          leader: "ME" | "GHOST";
          deltaM: number;
      }
    | {
          type: "run/distance";
          distanceKM: string;
          totalTime: number;
          totalCalories: number | null;
          avgPace: number | null;
      }
    | {
          type: "custom";
          text: string;
          priority?: VoicePriority;
          cooldownKey?: string;
      };

type Utterance = {
    text: string;
    priority?: VoicePriority;
    cooldownKey?: string;
};

class VoiceGuide {
    private speaking = false;
    private queue: Utterance[] = [];
    private lastSpokenAt: Record<string, number> = {};
    private enabled = false;

    // 전역 설정
    private lang = "ko-KR";
    private rate = 1.0;
    private cooldownMs: Record<string, number> = {
        "nav/approach-leg": 3000,
        "run/offcourse-warning": 5000,
        "run/ghost-change-leader": 5000,
    };

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    setRate(rate: number) {
        this.rate = rate;
    }

    setLang(lang: string) {
        this.lang = lang;
    }

    announce(event: VoiceEvent) {
        if (
            !this.enabled &&
            !useAuthStore.getState().userSettings?.voiceGuidanceEnabled
        )
            return;

        const utter = this.toUtterance(event);
        if (!utter) return;

        if (utter.cooldownKey) {
            const last = this.lastSpokenAt[utter.cooldownKey] ?? 0;
            const now = Date.now();
            const cool = this.cooldownMs[utter.cooldownKey] ?? 1000;

            console.log("cooldown", utter.cooldownKey, now - last, cool);

            if (now - last < cool) return;

            this.lastSpokenAt[utter.cooldownKey] = now;
        }

        const priorityMap = {
            CRITICAL: 10,
            HIGH: 8,
            NORMAL: 5,
            LOW: 3,
        } as const;
        const priority = priorityMap[utter.priority ?? "NORMAL"];

        const idx = this.queue.findIndex((q) => {
            const queuePriority = priorityMap[q.priority ?? "NORMAL"];
            return queuePriority < priority;
        });
        if (idx >= 0) this.queue.splice(idx, 0, utter);
        else this.queue.push(utter);

        if (priority >= 10 && this.speaking) {
            Speech.stop();
            this.speaking = false;
        }

        this.trySpeakNext();
    }

    stopAll() {
        Speech.stop();
        this.queue = [];
        this.speaking = false;
    }

    clearQueue() {
        this.queue = [];
    }

    private async trySpeakNext() {
        if (this.speaking || this.queue.length === 0) return;
        const next = this.queue.shift()!;
        this.speaking = true;
        await initAudioModule();
        Speech.speak(next.text, {
            language: this.lang,
            rate: this.rate,
            onDone: () => {
                this.speaking = false;
                this.trySpeakNext();
            },
            onStopped: () => {
                this.speaking = false;
            },
            onError: (error) => {
                Sentry.captureException(error, {
                    extra: {
                        text: next.text,
                    },
                });
                this.speaking = false;
                this.trySpeakNext();
            },
        });
    }

    private toUtterance(event: VoiceEvent): Utterance | null {
        switch (event.type) {
            case "nav/enter-leg": {
                return {
                    text: `앞으로 ${event.meters} 미터 동안 12시 방향입니다.`,
                    priority: "HIGH",
                    cooldownKey: `nav/enter-leg:${event.meters}:${event.legIndex}`,
                };
            }
            case "nav/approach-leg": {
                const angleText = toClockDir(event.angle);
                return {
                    text: `${event.meters} 미터 앞에서 ${angleText}입니다.`,
                    priority: "HIGH",
                    cooldownKey: `nav/approach-leg:${event.meters}:${event.legIndex}`,
                };
            }
            case "nav/end-approach-alert": {
                return {
                    text: `${event.meters} 미터 후 완주 지점입니다.`,
                    priority: "HIGH",
                    cooldownKey: `nav/end-approach-alert:${event.meters}:${event.legIndex}`,
                };
            }
            case "run/start": {
                return { text: "러닝을 시작합니다.", priority: "NORMAL" };
            }
            case "run/pause": {
                return {
                    text:
                        event.reason === "user"
                            ? "러닝을 일시정지합니다."
                            : "코스를 이탈하였습니다. 러닝을 일시정지합니다.",
                    priority: "CRITICAL",
                    cooldownKey: "run/pause",
                };
            }
            case "run/resume": {
                return {
                    text: "러닝을 다시 시작합니다.",
                    priority: "CRITICAL",
                };
            }
            case "run/complete": {
                const prefix = "코스를 완주했습니다. ";
                const time = getRunTime(event.totalTime, "HH:MM:SS").split(":");
                const timeText =
                    "시간 " +
                    (time.length === 3
                        ? `${time[0]}시간 ${time[1]}분 ${time[2]}초`
                        : `${time[0]}분 ${time[1]}초 `);
                const distanceKm = (event.totalDistance / 1000).toFixed(2);
                const distanceText = "거리 " + distanceKm + "km ";
                const caloriesText = event.totalCalories
                    ? `소모칼로리 ${event.totalCalories} 칼로리 `
                    : "";
                const pace = getFormattedPace(event.avgPace ?? 0).split("’");
                const paceText =
                    "평균 페이스 " + pace[0] + "분 " + pace[1] + "초 ";
                return {
                    text:
                        prefix +
                        timeText +
                        distanceText +
                        paceText +
                        caloriesText,
                    priority: "CRITICAL",
                    cooldownKey: "run/complete",
                };
            }
            case "run/offcourse-warning": {
                return {
                    text: "코스를 이탈하였습니다. 10분 뒤 자동 종료됩니다.",
                    priority: "CRITICAL",
                    cooldownKey: "run/offcourse-warning",
                };
            }
            case "run/extend": {
                return {
                    text: "러닝을 이어서 시작합니다.",
                    priority: "CRITICAL",
                };
            }
            case "run/stop": {
                const prefix = "러닝을 종료했습니다. ";
                const time = getRunTime(event.totalTime, "HH:MM:SS").split(":");
                const timeText =
                    "시간 " +
                    (time.length === 3
                        ? `${time[0]}시간 ${time[1]}분 ${time[2]}초`
                        : `${time[0]}분 ${time[1]}초`);
                const distanceKm = (event.totalDistance / 1000).toFixed(2);
                const distanceText = "거리 " + distanceKm + "km ";
                const caloriesText = event.totalCalories
                    ? `소모칼로리 ${event.totalCalories} 칼로리 `
                    : "";
                const pace = getFormattedPace(event.avgPace ?? 0).split("’");
                const paceText =
                    "평균 페이스 " + pace[0] + "분 " + pace[1] + "초 ";
                return {
                    text:
                        prefix +
                        timeText +
                        distanceText +
                        paceText +
                        caloriesText,
                    priority: "CRITICAL",
                    cooldownKey: "run/stop",
                };
            }
            case "run/ghost-change-leader": {
                return {
                    text:
                        event.leader === "ME"
                            ? "고스트를 추월하였습니다. 거리 차이는 " +
                              event.deltaM +
                              " 미터 입니다."
                            : "고스트가 앞서고 있습니다. 거리 차이는 " +
                              event.deltaM +
                              " 미터 입니다.",
                    priority: "HIGH",
                    cooldownKey: "run/ghost-change-leader",
                };
            }
            case "run/distance": {
                const prefix = "거리 " + event.distanceKM + "km";
                const time = getRunTime(event.totalTime, "HH:MM:SS").split(":");
                const timeText =
                    "시간 " +
                    (time.length === 3
                        ? `${time[0]}시간 ${time[1]}분 ${time[2]}초`
                        : `${time[0]}분 ${time[1]}초`);
                const pace = getFormattedPace(event.avgPace ?? 0).split("’");
                const paceText =
                    "평균 페이스 " + pace[0] + "분 " + pace[1] + "초 ";
                const caloriesText = event.totalCalories
                    ? `소모칼로리 ${event.totalCalories} 칼로리 입니다.`
                    : "";
                return {
                    text: `${prefix} ${timeText} ${paceText} ${caloriesText}`,
                    priority: "HIGH",
                    cooldownKey: "run/distance" + event.distanceKM,
                };
            }
            case "custom": {
                return {
                    text: event.text,
                    priority: event.priority,
                    cooldownKey: event.cooldownKey,
                };
            }
            default: {
                return null;
            }
        }
    }
}

// 0~360 정규화
const norm360 = (a: number) => ((a % 360) + 360) % 360;

//각도 → "N시 방향" (가장 가까운 시각으로 라운딩)
const toClockDir = (angle?: number | null) => {
    if (angle == null || Number.isNaN(angle)) return "";
    const a = norm360(angle);
    const idx = Math.floor((a + 15) / 30) % 12; // 0=12시, 1=1시, ...
    const labels = [
        "12시",
        "1시",
        "2시",
        "3시",
        "4시",
        "5시",
        "6시",
        "7시",
        "8시",
        "9시",
        "10시",
        "11시",
    ];
    return `${labels[idx]} 방향`;
};

export const voiceGuide = new VoiceGuide();
