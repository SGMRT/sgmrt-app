import { Event, Utterance } from "./types";
import { kmTick, summary, toClock, uid } from "./utils";

const make = (text: string, opt: Partial<Utterance>): Utterance => ({
    id: uid("utt"),
    channel: "CUSTOM",
    text,
    priority: "NORMAL",
    atomic: false,
    canBarge: false,
    interruptLower: false,
    ...opt,
});

export function formatEvent(e: Event): Utterance[] {
    switch (e.type) {
        case "nav/approach-leg":
            return [
                make(`${e.meters} 미터 앞에서 ${toClock(e.angle)}입니다.`, {
                    channel: "NAV",
                    priority: "HIGH",
                    atomic: true,
                    canBarge: false,
                    interruptLower: true,
                    cooldownKey: `nav/approach-leg`,
                    navKind: "APPROACH",
                }),
            ];
        case "nav/end-approach-alert":
            return [
                make(`${e.meters} 미터 후 완주 지점입니다.`, {
                    channel: "NAV",
                    priority: "HIGH",
                    atomic: true,
                    canBarge: false,
                    interruptLower: true,
                    cooldownKey: `nav/end-approach-alert`,
                    navKind: "APPROACH",
                }),
            ];
        case "nav/enter-leg":
            return [
                make(`앞으로 ${e.meters} 미터 동안 12시 방향입니다.`, {
                    channel: "NAV",
                    priority: "HIGH",
                    atomic: false,
                    canBarge: true,
                    interruptLower: true,
                    cooldownKey: `nav/enter-leg`,
                    runKind: "START",
                }),
            ];

        case "run/start":
            return [
                make("러닝을 시작합니다.", {
                    channel: "RUN",
                    priority: "NORMAL",
                    atomic: false,
                    canBarge: true,
                    interruptLower: true,
                    cooldownKey: `run/start`,
                    navKind: "KEEP",
                }),
            ];
        case "run/resume":
            return [
                make("러닝을 다시 시작합니다.", {
                    channel: "RUN",
                    priority: "CRITICAL",
                    canBarge: true,
                    hardCut: true,
                }),
            ];
        case "run/extend":
            return [
                make("러닝을 이어서 시작합니다.", {
                    channel: "RUN",
                    priority: "CRITICAL",
                    canBarge: true,
                    hardCut: true,
                }),
            ];
        case "run/pause":
            return [
                make(
                    e.reason === "user"
                        ? "러닝을 일시정지합니다."
                        : "코스를 이탈하였습니다. 러닝을 일시정지합니다.",
                    {
                        channel: "RUN",
                        priority: "CRITICAL",
                        canBarge: true,
                        cooldownKey: "run/pause",
                        hardCut: true,
                    }
                ),
            ];
        case "run/offcourse-warning":
            return [
                make("코스를 이탈하였습니다. 10분 뒤 자동 종료됩니다.", {
                    channel: "RUN",
                    priority: "CRITICAL",
                    canBarge: true,
                    cooldownKey: "run/offcourse-warning",
                    hardCut: true,
                }),
            ];
        case "run/complete": {
            const s = summary(
                e.totalTime,
                e.totalDistance,
                e.avgPace,
                e.totalCalories
            );
            return [
                make(
                    `코스를 완주했습니다. ${s.timeText}${s.distanceText}${s.paceText}${s.caloriesText}입니다.`,
                    {
                        channel: "RUN",
                        priority: "CRITICAL",
                        canBarge: true,
                        cooldownKey: "run/complete",
                        hardCut: true,
                    }
                ),
            ];
        }
        case "run/stop": {
            const s = summary(
                e.totalTime,
                e.totalDistance,
                e.avgPace,
                e.totalCalories
            );
            return [
                make(
                    `러닝을 종료했습니다. ${s.timeText}${s.distanceText}${s.paceText}${s.caloriesText}입니다.`,
                    {
                        channel: "RUN",
                        priority: "CRITICAL",
                        canBarge: true,
                        cooldownKey: "run/stop",
                        hardCut: true,
                    }
                ),
            ];
        }
        case "run/distance": {
            const k = kmTick(
                e.distanceKM,
                e.totalTime,
                e.avgPace,
                e.totalCalories
            );
            return [
                make(`${k.distOnly}${k.timeOnly}${k.paceOnly}${k.calOnly}`, {
                    channel: "RUN",
                    priority: "HIGH",
                    cooldownKey: `run/distance:${e.distanceKM}`,
                }),
            ];
        }

        case "ghost/change-leader":
            return [
                make(
                    e.leader === "ME"
                        ? "고스트를 추월하였습니다."
                        : "고스트가 앞서고 있습니다.",
                    {
                        channel: "GHOST",
                        priority: "HIGH",
                        canBarge: true,
                        cooldownKey: "ghost/change-leader",
                    }
                ),
            ];
        case "ghost/periodic":
            return [
                make(
                    e.leader === "GHOST"
                        ? "고스트가 앞서고 있습니다."
                        : `현재 선두 입니다.  거리 차이는 ${e.deltaM} 미터 입니다.`,
                    {
                        channel: "GHOST",
                        priority: "HIGH",
                        cooldownKey: "ghost/periodic",
                    }
                ),
            ];

        case "ghosty":
            return [
                make(e.message, {
                    channel: "CUSTOM",
                    priority: "CRITICAL",
                    canBarge: true,
                    cooldownKey: "ghosty",
                }),
            ];

        case "custom":
            return [
                make(e.text, {
                    channel: "CUSTOM",
                    priority: e.priority ?? "NORMAL",
                    canBarge: true,
                    cooldownKey: e.cooldownKey ?? "custom",
                }),
            ];

        case "pacer/script":
            // orchestrator에서 전용 API로 처리
            return [];
    }
}
