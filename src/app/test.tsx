import { useQuery } from "@tanstack/react-query";
import { SplashScreen } from "expo-router";
import { useEffect, useMemo } from "react";
import { getCourse, getPacemakerByCourseId, getPacemakerDetail } from "../apis";
import { mapPacemakerToGhostySets } from "../features/pacemaker/utils/mapPacemakerToGhostySets";

const courseId = 728;

export default function Test() {
    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
    }, []);

    const { data: course } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId),
        staleTime: 60_000,
    });

    const { data: pacemakerSummary } = useQuery({
        queryKey: ["pacemaker", courseId],
        queryFn: () => getPacemakerByCourseId(courseId),
        enabled: !!course, // 코스가 있을 때만
        staleTime: 60_000,
    });

    const { data: pacemakerResponse } = useQuery({
        queryKey: [
            "pacemakerDetail",
            pacemakerSummary?.pacemakerSummaryResponse?.id,
        ],
        queryFn: () =>
            getPacemakerDetail(pacemakerSummary!.pacemakerSummaryResponse.id),
        enabled: !!pacemakerSummary?.pacemakerSummaryResponse?.id,
        select: (detail) => detail.pacemakerResponse,
        staleTime: 60_000,
    });

    const ghostySet = useMemo(() => {
        return mapPacemakerToGhostySets(course?.telemetries, pacemakerResponse);
    }, [course?.telemetries, pacemakerResponse]);

    useEffect(() => {
        if (!ghostySet) return;
        console.log(
            ghostySet.sets
                .map((it) => {
                    return `${it.startPointIndex} - ${it.endPointIndex}`;
                })
                .join("\n")
        );
    }, [ghostySet]);

    return <></>;
}
