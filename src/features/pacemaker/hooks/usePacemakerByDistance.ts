// src/features/pacemaker/hooks/usePacerByDistance.ts
import { Pacemaker } from "@/src/apis/types/ghosty";
import { useEffect, useMemo, useRef } from "react";
import { voice } from "../../audio/voice";
import type { Event } from "../../audio/voice/types";

function parseMinDotSecToSec(input: number | string): number {
    const raw = String(input).trim();
    if (!raw || raw === "." || isNaN(Number(raw))) return 0;
    const [mStr, sStrRaw = "0"] = raw.split(".");
    const m = Math.max(0, parseInt(mStr || "0", 10));
    const onlyDigits = sStrRaw.replace(/\D+/g, "");
    const s =
        sStrRaw.length === 1
            ? parseInt(sStrRaw, 10) * 10
            : parseInt(onlyDigits.padEnd(2, "0").slice(0, 2) || "0", 10);
    return m * 60 + Math.min(s, 59);
}

type Props = {
    pacer: Pacemaker | null | undefined;
    currentDistM: number;
    /** pacer.sets 의 단위가 km이면 1000(기본), m이면 1 */
    distanceScale?: number;
    enabled?: boolean;
};

export function usePacerByDistance({
    pacer,
    currentDistM,
    distanceScale = 1000,
    enabled = true,
}: Props) {
    // 세트 메타: [startM, endM, message, paceSecPerKm]
    const sets = useMemo(() => {
        if (!pacer?.sets?.length) return [];
        return pacer.sets
            .map((s, idx) => ({
                idx,
                startM: Math.max(0, (s.startPoint ?? 0) * distanceScale),
                endM: Math.max(0, (s.endPoint ?? 0) * distanceScale),
                message: s.message ?? "",
                paceSecPerKm: parseMinDotSecToSec(s.pace as any),
            }))
            .sort((a, b) => a.startM - b.startM);
    }, [pacer, distanceScale]);

    // 초기 멘트는 첫 세트 돌입 시 한 번
    const initialSpokenRef = useRef(false);
    // 각 세트 시작 멘트 1회성
    const spokenSetStart = useRef<Set<number>>(new Set());

    // 현재 세트 찾기(거리만)
    const currentSet = useMemo(() => {
        if (!enabled || !sets.length) return null;
        const s = sets.find(
            (seg) => currentDistM >= seg.startM && currentDistM <= seg.endM
        );
        return s ?? null;
    }, [enabled, sets, currentDistM]);

    // 1) 첫 세트 진입 시 initialMessage 1회
    useEffect(() => {
        if (
            !enabled ||
            !pacer?.initialMessage ||
            initialSpokenRef.current ||
            sets.length === 0
        )
            return;
        const first = sets[0];
        if (currentDistM >= first.startM && currentDistM <= first.endM) {
            initialSpokenRef.current = true;
            voice.dispatch({
                type: "pacer/script",
                script: pacer.initialMessage,
                priority: "NORMAL",
            } as Event);
        }
    }, [enabled, pacer?.initialMessage, sets, currentDistM]);

    // 2) 세트 시작 지점 진입 시 메시지 1회 (dist만 기준)
    useEffect(() => {
        if (!enabled || !currentSet) return;
        const { idx, startM, message } = currentSet;
        // "해당 세트 범위에 들어왔고 아직 안 말했으면" 발화
        if (currentDistM >= startM && !spokenSetStart.current.has(idx)) {
            spokenSetStart.current.add(idx);
            if (message.trim()) {
                voice.dispatch({
                    type: "pacer/script",
                    script: message,
                    priority: "NORMAL",
                } as Event);
            }
        }
    }, [enabled, currentSet, currentDistM]);

    return {
        /** UI에 띄울 현재 세트 목표 페이스(sec/km). 없으면 null */
        currentPaceSecPerKm: currentSet?.paceSecPerKm ?? null,
        /** 현재 세트 인덱스(없으면 null) */
        currentSetIndex: currentSet?.idx ?? null,
        /** 세트 메타(필요시 디버그/표시용) */
        setsMeta: sets,
    };
}
