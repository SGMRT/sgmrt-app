import { getPacemakerDetail } from "@/src/apis";
import { Telemetry } from "@/src/apis/types/run";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { RunContext } from "../../run/state/context";
import { mapPacemakerToGhostySets } from "../utils/mapPacemakerToGhostySets";

interface PacemakerProps {
    pacemakerId?: number | string;
    courseTelemetry: Telemetry[];
    context: RunContext;
    timestamp: number;
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

    if (!pacemakerId || !courseTelemetry || courseTelemetry.length === 0)
        return;

    const { data: pacemakerDetail } = useQuery({
        queryKey: ["pacemaker", pacemakerId],
        queryFn: () => getPacemakerDetail(Number(pacemakerId)),
        enabled: !!pacemakerId,
        select: (detail) => detail.pacemakerResponse,
        staleTime: Infinity,
    });

    const ghostySet = useMemo(() => {
        return mapPacemakerToGhostySets(courseTelemetry, pacemakerDetail);
    }, [courseTelemetry, pacemakerDetail]);

    const courseDists = useMemo(
        () => courseTelemetry.map((t) => t.dist),
        [courseTelemetry]
    );
    const lastCourseIdx = courseDists.length - 1;

    const myPoint = context.telemetries[context.telemetries.length - 1];

    const progressIndexRef = useRef(-1);
    const lastSpokenRef = useRef(-2);
    const finishedRef = useRef(false);
    const setStartTimeRef = useRef<number | null>(null);

    const nearestIndex = (targetDist: number) => {
        let left = 0,
            right = lastCourseIdx;
        while (left < right) {
            const mid = (left + right) >> 1;
            if (courseDists[mid] < targetDist) left = mid + 1;
            else right = mid;
        }
        return Math.max(0, Math.min(lastCourseIdx, left));
    };
}
