import { P, Utterance } from "./types";

// NAV/APPROACH 도착 시: PACER 진행/큐 제거 여부
export const shouldKillPacerOnApproach = true;

// NAV/KEEP 도착 시: PACER 큐/진행이 있으면 KEEP 드랍
export function shouldDropNavKeep(
    queue: Utterance[],
    speaking: Utterance | null
): boolean {
    return (
        speaking?.channel === "PACER" ||
        queue.some((q) => q.channel === "PACER")
    );
}

// NAV 도착 시: PACER 잔여 큐 제거(KEEP은 어차피 드랍, APPROACH는 강제 비움)
export const clearPacerOnAnyNav = true;

// canBarge 조건: speaking.atomic === false 이고 새 우선순위가 더 높으면 끊기 허용
export function canBarge(
    speaking: Utterance | null,
    incoming: Utterance
): boolean {
    if (!speaking) return false;
    if (speaking.atomic) return false;
    return P[incoming.priority] > P[speaking.priority] && incoming.canBarge;
}
