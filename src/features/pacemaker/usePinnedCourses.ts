// usePinnedCourses.ts (수정)
import { getCourse } from "@/src/apis";
import { CourseDetailResponse, CourseResponse } from "@/src/apis/types/course";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { usePacemakerQueue } from "./queueStore";

type UsePinnedCoursesOptions = {
    baseCourses: CourseResponse[];
};

export function usePinnedCourses({ baseCourses }: UsePinnedCoursesOptions) {
    const jobs = usePacemakerQueue((s) => s.jobs);

    const pinnedIds = useMemo(() => {
        const ids = new Set<number>();
        for (const j of jobs) {
            if (j.status === "PROCEEDING" || j.status === "COMPLETED") {
                ids.add(j.courseId);
            }
        }
        return Array.from(ids);
    }, [jobs]);

    const missingIds = useMemo(
        () => pinnedIds.filter((id) => !baseCourses.some((c) => c.id === id)),
        [pinnedIds, baseCourses]
    );

    console.log("missingIds", missingIds);

    const results = useQueries({
        queries: missingIds.map((id) => ({
            queryKey: ["course", id],
            queryFn: () => getCourse(id),
            select: mapCourseDetailToSummary,
            enabled: id > 0,
            staleTime: 30_000,
            retry: 1,
        })),
    });

    const fetchedMissing: CourseResponse[] = useMemo(
        () =>
            results
                .map((r) => (r.isSuccess ? (r.data as CourseResponse) : null))
                .filter(Boolean) as CourseResponse[],
        [results]
    );

    const isLoading = results.some((r) => r.isLoading);
    const isFetching = results.some((r) => r.isFetching);
    const errors = results
        .map((r) => (r.isError ? r.error : null))
        .filter(Boolean) as Error[];

    const mergedCourses = useMemo(() => {
        const merged = [...baseCourses, ...fetchedMissing];
        const seen = new Set<number>();
        const dedup = merged.filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });
        // pinned 우선
        dedup.sort((a, b) => {
            const ap = pinnedIds.includes(a.id) ? 0 : 1;
            const bp = pinnedIds.includes(b.id) ? 0 : 1;
            return ap - bp;
        });

        return dedup;
    }, [baseCourses, fetchedMissing, pinnedIds]);

    return { mergedCourses, pinnedIds, isLoading, isFetching, errors };
}

function mapCourseDetailToSummary(
    course: CourseDetailResponse
): CourseResponse {
    return {
        ...course,
        ownerUuid: "-",
        startLat: course.telemetries[0].lat,
        startLng: course.telemetries[0].lng,
        routeUrl: "-",
        thumbnailUrl: "",
        runners: [] as unknown as CourseResponse["runners"],
        runnersCount: 0,
        createdAt: new Date(),
    };
}
