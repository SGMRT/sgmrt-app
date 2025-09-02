// useCourseProgress.ts
import { Checkpoint } from "@/src/apis/types/course";
import { Telemetry } from "@/src/apis/types/run";
import { getDistance } from "@/src/utils/mapUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { Controls } from "../../run/hooks/useRunningSession";
import { RunContext } from "../../run/state/context";
import { selectUserLocation } from "../../run/state/selectors";
import { buildCourseLegs } from "./utils/buildCourseLegs";
import { dedupeConsecutiveByLatLng } from "./utils/dedupeConsecutiveByLatLng";
import { nearestDistanceToPolylineM } from "./utils/nearestDistanceToPolylineM";

const OFFCOURSE_TOAST_MS = 3200;
const OFFCOURSE_NOTIFY_INTERVAL_MS = 4000;
const OFFCOURSE_AUTO_STOP_MS = 10 * 60 * 1000;

interface CourseProgressProps {
    context: RunContext;
    controls: Controls;
    onStart: () => void;
    onForceStop: () => void;

    onApproachNextLeg?: (info: {
        legIndex: number;
        nextAngle?: number | null;
        at: Checkpoint;
        remainingM: number;
    }) => void;

    guideAdvanceM?: number; // default 40
    startEnterM?: number; // default 25
    offEnterM?: number; // default 35
    offReturnM?: number; // default 18
    passCpM?: number; // default 15
}

export type CourseLeg = {
    index: number;
    start: Checkpoint;
    end: Checkpoint;
    legDistance: number; // (m)
    cumDistance: number; // (m) 코스 시작~현재 레그 끝
    points: Telemetry[]; // [startIdx..endIdx] 포함
};

export function useCourseProgress(props: CourseProgressProps) {
    const {
        context,
        controls,
        onStart,
        onApproachNextLeg,
        onForceStop,
        guideAdvanceM = 40,
        offEnterM = 35,
        offReturnM = 18,
        startEnterM = 25,
        passCpM = 15,
    } = props;

    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [legs, setLegs] = useState<CourseLeg[]>([]);
    const [legIndex, setLegIndex] = useState<number>(0);

    // 내부 상태
    const startedRef = useRef(false);
    const completedRef = useRef(false);
    const offRef = useRef(false);
    const offAnchorRef = useRef<Telemetry | null>(null);
    const approachFiredRef = useRef<Set<number>>(new Set()); // 레그별 안내 1회 트리거

    const offcourseStartedAtRef = useRef<number | null>(null);
    const offcourseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null
    );
    const offcourseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const offcourseToggleRef = useRef<boolean>(false);

    const initializeCourse = useCallback(
        (course: Telemetry[], checkpoints: Checkpoint[]) => {
            const deduped = dedupeConsecutiveByLatLng(checkpoints);
            setCheckpoints(deduped);
            const built = buildCourseLegs(course, deduped);
            setLegs(built);
            setLegIndex(0);

            // 리셋
            startedRef.current = false;
            completedRef.current = false;
            offRef.current = false;
            offAnchorRef.current = course[0];
            approachFiredRef.current.clear();
        },
        []
    );

    // 현재 위치(마지막 샘플)
    const current = useMemo(() => {
        const location = selectUserLocation(context);
        if (!location) return null;
        return {
            lat: location.latitude,
            lng: location.longitude,
        } as Telemetry;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.mainTimeline, context.pausedBuffer, context.mutedBuffer]);

    // 레그 내 “종점까지 남은 거리”(m) — 간단히: 레그 포인트 중 현재에 가장 가까운 인덱스를 잡고 그 이후 합
    const remainingAlongLegM = useCallback(
        (poly: Telemetry[], p: Telemetry): number => {
            if (poly.length === 0) return Infinity;
            // 가장 가까운 인덱스
            let minIdx = 0;
            let minD = Infinity;
            for (let i = 0; i < poly.length; i++) {
                const d = getDistance(poly[i], p);
                if (d < minD) {
                    minD = d;
                    minIdx = i;
                }
            }
            // minIdx → end까지 누적
            let rest = getDistance(p, poly[minIdx]); // 현재→최근접 포인트까지 보정
            for (let i = minIdx; i < poly.length - 1; i++) {
                rest += getDistance(poly[i], poly[i + 1]);
            }
            return rest;
        },
        []
    );

    // 안전 래퍼
    const safeComplete = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        controls.complete();
    }, [controls]);

    const enterOffcourse = useCallback(
        (anchor: Telemetry) => {
            if (offRef.current) return;
            offRef.current = true;
            offAnchorRef.current = anchor;
            controls.offcourse();
        },
        [controls]
    );

    const tryReturnOncourse = useCallback(
        (cur: Telemetry) => {
            if (!offRef.current) return;
            const anchor = offAnchorRef.current;
            if (!anchor) return;
            const d = getDistance(cur, anchor);
            if (d <= offReturnM) {
                offRef.current = false;
                offAnchorRef.current = null;
                controls.oncourse();
            }
        },
        [controls, offReturnM]
    );

    useEffect(() => {
        const isOffcourse = context.status === "PAUSED_OFFCOURSE";

        if (isOffcourse) {
            if (!offcourseStartedAtRef.current) {
                offcourseStartedAtRef.current = Date.now();
                offcourseToggleRef.current = false; // 초기화

                // 즉시 1회: "코스를 이탈하였습니다"
                Toast.hide();
                Toast.show({
                    type: "info",
                    text1: "코스를 이탈하였습니다",
                    text2: "10분 뒤 자동 종료됩니다",
                    position: "bottom",
                    bottomOffset: 60,
                    visibilityTime: OFFCOURSE_TOAST_MS,
                });

                controls.setLiveActivityMessage(
                    "코스를 이탈하였습니다",
                    "WARNING"
                );

                // 4초마다 "코스를 이탈..." / "10분 뒤 자동 종료..." 번갈아 표시
                offcourseIntervalRef.current = setInterval(() => {
                    offcourseToggleRef.current = !offcourseToggleRef.current;
                    const first = offcourseToggleRef.current;

                    Toast.hide();
                    Toast.show({
                        type: "info",
                        text1: first
                            ? "코스를 이탈하였습니다"
                            : "10분 뒤 자동 종료됩니다",
                        position: "bottom",
                        bottomOffset: 60,
                        visibilityTime: OFFCOURSE_TOAST_MS,
                    });

                    controls.setLiveActivityMessage(
                        first
                            ? "코스를 이탈하였습니다"
                            : "10분 뒤 자동 종료됩니다",
                        "WARNING"
                    );
                }, OFFCOURSE_NOTIFY_INTERVAL_MS);

                // 10분 뒤 자동 종료
                offcourseTimeoutRef.current = setTimeout(() => {
                    Toast.hide();
                    Toast.show({
                        type: "error",
                        text1: "러닝이 자동 종료되었습니다",
                        position: "bottom",
                        bottomOffset: 60,
                        visibilityTime: OFFCOURSE_TOAST_MS,
                    });
                    controls.setLiveActivityMessage(
                        "러닝이 자동 종료되었습니다",
                        "ERROR"
                    );
                    onForceStop();
                }, OFFCOURSE_AUTO_STOP_MS);
            }
        } else {
            // 오프코스가 아니면 타이머/인터벌 정리
            if (offcourseIntervalRef.current) {
                clearInterval(offcourseIntervalRef.current);
                offcourseIntervalRef.current = null;
            }
            if (offcourseTimeoutRef.current) {
                clearTimeout(offcourseTimeoutRef.current);
                offcourseTimeoutRef.current = null;
            }
            offcourseStartedAtRef.current = null;
            offcourseToggleRef.current = false;
            Toast.hide();
            controls.setLiveActivityMessage(null, null);
        }

        // 언마운트/의존성 변경 시 안전 정리
        return () => {
            if (offcourseIntervalRef.current) {
                clearInterval(offcourseIntervalRef.current);
                offcourseIntervalRef.current = null;
            }
            if (offcourseTimeoutRef.current) {
                clearTimeout(offcourseTimeoutRef.current);
                offcourseTimeoutRef.current = null;
            }
        };
    }, [context.status, onForceStop, controls]);

    useEffect(() => {
        if (!current) return;
        if (!legs.length) return;
        if (completedRef.current) return;

        const leg = legs[legIndex] ?? null;
        if (!leg) return;

        // 1) READY: 첫 체크포인트 근접 시 onStart()
        if (context.status === "READY" && !startedRef.current) {
            const dStart = getDistance(current, checkpoints[0]);
            if (dStart <= startEnterM) {
                startedRef.current = true;
                offAnchorRef.current = null;
                onStart();
            }
            return; // READY 중엔 아래 로직 skip
        }

        // 2) 오프코스 진입/복귀 (앵커 기반 복귀)
        if (context.status === "RUNNING") {
            const distToLine = nearestDistanceToPolylineM(leg.points, current);
            if (distToLine > offEnterM) {
                enterOffcourse(current);
            }
        } else if (context.status === "PAUSED_OFFCOURSE") {
            tryReturnOncourse(current);
        }

        // 3) 다음 레그 안내: 마지막 레그에선 안내 안함
        if (
            legIndex < legs.length - 1 &&
            !approachFiredRef.current.has(legIndex)
        ) {
            const remaining = remainingAlongLegM(leg.points, current);
            if (remaining <= guideAdvanceM) {
                approachFiredRef.current.add(legIndex);
                onApproachNextLeg?.({
                    legIndex,
                    nextAngle: leg.end?.angle ?? null,
                    at: leg.end,
                    remainingM: Math.max(0, Math.round(remaining)),
                });
            }
        }

        // 4) 레그 종료/완주 판정
        const dEnd = getDistance(current, leg.end);

        // 마지막 레그: 모든 레그 완료 시 단 한 번만 complete
        if (legIndex === legs.length - 1) {
            if (dEnd <= passCpM) {
                safeComplete(); // ref로 보장: 정확히 한 번
                return; // 이후 아무 것도 하지 않음
            }
            return; // 아직 완주 X → 대기
        }

        // 마지막 이전 레그: 통과 시 다음 레그로 1단계만 전진
        if (dEnd <= passCpM) {
            setLegIndex((i) => Math.min(i + 1, legs.length - 1));
            console.log("setLegIndex", legIndex);
        }
    }, [
        current,
        legs,
        legIndex,
        checkpoints,
        context.status,
        remainingAlongLegM,
        onStart,
        onApproachNextLeg,
        guideAdvanceM,
        offEnterM,
        enterOffcourse,
        tryReturnOncourse,
        safeComplete,
        startEnterM,
        passCpM,
    ]);

    return {
        initializeCourse,
        legs,
        legIndex,
        isOffcourse: offRef.current,
        offcourseAnchor: offAnchorRef.current, // 필요하면 외부에서도 참조 가능
        isCompleted: completedRef.current,
    };
}
