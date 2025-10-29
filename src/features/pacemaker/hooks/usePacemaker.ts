import { getPacemakerDetail } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import { Segment } from "@/src/components/map/RunningLine";
import { telemetriesToSegment } from "@/src/utils/runUtils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { RunContext } from "../../run/state/context";
import { mapPacemakerToGhostySets } from "../utils/mapPacemakerToGhostySets";

interface PacemakerProps {
    pacemakerId?: number | string;
    courseTelemetry: Telemetry[]; // 코스 텔레메트리
    context: RunContext;
    timestamp: number; // 외부 틱(1초 등)
    onSpeak?: (text: string) => void;
    onSetChange?: (nextIndex: number) => void;
    onFinish?: () => void;
}

export function usePacemaker(props: PacemakerProps) {
    const {
        pacemakerId,
        courseTelemetry,
        context,
        timestamp,
        onSpeak,
        onSetChange,
        onFinish,
    } = props;

    const [ghostyTelemetry, setGhostyTelemetry] = useState<Telemetry | null>(
        null
    );
    const ghostySegmentRef = useRef<Segment | null>(null);

    // 훅 순서 유지 (조기 return 금지)
    const enabled =
        !!pacemakerId &&
        Array.isArray(courseTelemetry) &&
        courseTelemetry.length > 0;

    const { data: pacemakerDetail } = useQuery({
        queryKey: ["pacemaker", pacemakerId],
        queryFn: () => getPacemakerDetail(Number(pacemakerId)),
        enabled: !!pacemakerId,
        select: (detail) => detail.pacemakerResponse,
        staleTime: Infinity,
    });

    const ghostySet = useMemo(() => {
        if (!enabled) return null;
        return mapPacemakerToGhostySets(courseTelemetry, pacemakerDetail);
    }, [enabled, courseTelemetry, pacemakerDetail]);

    const courseDists = useMemo(
        () => (enabled ? courseTelemetry.map((t) => t.dist) : []),
        [enabled, courseTelemetry]
    );
    const lastCourseIdx = courseDists.length ? courseDists.length - 1 : 0;

    const myPoint = context.telemetries[context.telemetries.length - 1];

    const progressIndexRef = useRef(-1);
    const lastSpokenRef = useRef(-2);
    const finishedRef = useRef(false);

    const setStartTimeRef = useRef<number | null>(null); // 세트 시작 시각(ms)
    const pauseStartMsRef = useRef<number | null>(null); // 일시정지 시작 시각(ms)
    const pausedAccMsRef = useRef<number>(0); // 세트 내 누적 일시정지 시간(ms)

    const nearestIndex = (targetDist: number) => {
        if (!enabled || courseDists.length === 0) return 0;
        let l = 0,
            r = lastCourseIdx;
        while (l < r) {
            const m = (l + r) >> 1;
            if (courseDists[m] < targetDist) l = m + 1;
            else r = m;
        }
        return Math.max(0, Math.min(lastCourseIdx, l));
    };

    const isActiveRunning = (s: RunContext["status"]) =>
        s === "RUNNING" || s === "RUNNING_EXTENDED";

    // 초기/disable 시 상태 리셋 + initial message
    useEffect(() => {
        if (!enabled) {
            progressIndexRef.current = -1;
            lastSpokenRef.current = -2;
            finishedRef.current = false;
            setStartTimeRef.current = null;
            pauseStartMsRef.current = null;
            pausedAccMsRef.current = 0;
            setGhostyTelemetry(null);
            return;
        }
        if (!ghostySet) return;

        if (progressIndexRef.current === -1) {
            if (ghostySet.initialMessage?.trim())
                onSpeak?.(ghostySet.initialMessage);
            progressIndexRef.current = 0;
            setStartTimeRef.current = Date.now();
            pauseStartMsRef.current = null;
            pausedAccMsRef.current = 0;
        }
    }, [enabled, ghostySet, onSpeak]);

    // 상태 전이 감지: RUNNING ↔ PAUSED
    useEffect(() => {
        if (!enabled || !ghostySet || ghostySet.sets.length === 0) return;

        // 일시정지로 진입
        if (!isActiveRunning(context.status)) {
            if (pauseStartMsRef.current == null) {
                pauseStartMsRef.current = Date.now();
            }
            return;
        }

        // 재개로 진입
        if (isActiveRunning(context.status)) {
            if (pauseStartMsRef.current != null) {
                pausedAccMsRef.current += Date.now() - pauseStartMsRef.current;
                pauseStartMsRef.current = null;
            }

            // 재개 시: 이미 사용자 도달했는지 즉시 확인 → 함께 다음 세트 시작
            const idx = progressIndexRef.current;
            const sets = ghostySet.sets;
            if (idx >= 0 && idx < sets.length && myPoint) {
                const cur = sets[idx];
                const endDist = courseTelemetry[cur.endPointIndex].dist;
                const userReached = myPoint.dist >= endDist - 0.5;

                if (userReached) {
                    // 고스티를 엔드로 스냅하고 다음 세트 시작
                    const ghostEnd = courseTelemetry[cur.endPointIndex];
                    ghostEnd.pace = cur.pace;
                    setGhostyTelemetry(ghostEnd ?? null);

                    const nextIdx = idx + 1;
                    progressIndexRef.current = nextIdx;

                    if (nextIdx >= sets.length) {
                        if (!finishedRef.current) {
                            finishedRef.current = true;
                            onFinish?.();
                        }
                    } else {
                        const next = sets[nextIdx];
                        if (next.message?.trim()) onSpeak?.(next.message);
                        lastSpokenRef.current = nextIdx;
                        onSetChange?.(nextIdx);
                        // 새 세트 타이머 초기화
                        setStartTimeRef.current = Date.now();
                        pauseStartMsRef.current = null;
                        pausedAccMsRef.current = 0;
                    }
                }
            }
        }
    }, [
        enabled,
        ghostySet,
        context.status,
        myPoint,
        courseTelemetry,
        onFinish,
        onSetChange,
        onSpeak,
    ]);

    // 메인 루프: RUNNING 상태에서만 고스티 진행
    useEffect(() => {
        if (!enabled) return;
        if (!ghostySet || ghostySet.sets.length === 0) return;
        if (finishedRef.current) return;
        if (!isActiveRunning(context.status)) return;

        const sets = ghostySet.sets;
        let idx = progressIndexRef.current;
        if (idx < 0 || idx >= sets.length) return;

        const cur = sets[idx];

        // 세트 시작 메시지(1회)
        if (lastSpokenRef.current !== idx) {
            if (cur.message?.trim()) onSpeak?.(cur.message);
            lastSpokenRef.current = idx;
            onSetChange?.(idx);
            setStartTimeRef.current = Date.now();
            pauseStartMsRef.current = null;
            pausedAccMsRef.current = 0;
        }

        const startDist = courseTelemetry[cur.startPointIndex].dist;
        const endDist = courseTelemetry[cur.endPointIndex].dist;
        const segLen = Math.max(0, endDist - startDist);

        // 진행 시간(초) = (현재 - 세트시작 - 누적일시정지 - 현재 진행 중 일시정지 구간)
        const now = Date.now();
        const pausedNowMs =
            pauseStartMsRef.current != null ? now - pauseStartMsRef.current : 0;
        const elapsedMs =
            (setStartTimeRef.current ? now - setStartTimeRef.current : 0) -
            pausedAccMsRef.current -
            pausedNowMs;
        const elapsedSec = Math.max(0, elapsedMs / 1000);

        const durationSec = Math.max(0.01, cur.duration);
        const progress = Math.min(1, Math.max(0, elapsedSec / durationSec));

        // 고스티 현재 거리 (duration 기반 선형 진행)
        let ghostDist = startDist + segLen * progress;
        let ghostReached = progress >= 1 - 1e-6;

        // 사용자 도달 여부
        const userDist = myPoint?.dist ?? 0;
        const userReached = userDist >= endDist - 0.5;

        // 규칙 반영
        if (ghostReached && !userReached) {
            ghostDist = endDist; // 고스티 엔드에서 대기
        } else if (userReached && !ghostReached) {
            ghostDist = endDist; // 사용자 선도착 → 고스티 스냅
            ghostReached = true;
        }

        // 둘 다 도달하면 다음 세트 동시 시작
        if (ghostReached && userReached) {
            idx += 1;
            progressIndexRef.current = idx;

            if (idx >= sets.length) {
                if (!finishedRef.current) {
                    finishedRef.current = true;
                    onFinish?.();
                }
            } else {
                const next = sets[idx];
                if (next.message?.trim()) onSpeak?.(next.message);
                lastSpokenRef.current = idx;
                onSetChange?.(idx);
                setStartTimeRef.current = Date.now();
                pauseStartMsRef.current = null;
                pausedAccMsRef.current = 0;
            }
        }

        // 현재 고스티 위치 반환 (엔드 대기/스냅 반영)
        const gi = nearestIndex(ghostDist);
        setGhostyTelemetry(courseTelemetry[gi] ?? null);
        ghostySegmentRef.current = telemetriesToSegment(courseTelemetry, gi)[0];
    }, [
        enabled,
        timestamp,
        context.status,
        ghostySet,
        myPoint,
        courseTelemetry,
        onFinish,
        onSetChange,
        onSpeak,
    ]);

    return { ghostyTelemetry, ghostySegment: ghostySegmentRef.current }; // Telemetry | null
}
