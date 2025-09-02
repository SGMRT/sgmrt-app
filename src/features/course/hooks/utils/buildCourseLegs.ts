import { Checkpoint } from "@/src/apis/types/course";
import { Telemetry } from "@/src/apis/types/run";
import { getDistance } from "@/src/utils/mapUtils";
import { CourseLeg } from "../useCourseProgress";

type LatLngLike = { lat: number; lng: number };

export function buildCourseLegs(
    course: Telemetry[],
    checkpoints: Checkpoint[],
    opts?: { epsMeters?: number }
): CourseLeg[] {
    const eps = opts?.epsMeters ?? 3; // 좌표 근접 허용치(미터)

    if (course.length < 2 || checkpoints.length < 2) return [];

    // 1) 코스 누적거리(prefix) 계산 (O(N))
    const pref: number[] = new Array(course.length).fill(0);
    for (let i = 1; i < course.length; i++) {
        pref[i] = pref[i - 1] + getDistance(course[i - 1], course[i]);
    }
    const segDist = (a: number, b: number) => Math.max(0, pref[b] - pref[a]);

    // 2) 코스 포인트 인덱스 빠른 매핑 (정확 일치 먼저 시도)
    const key = (p: LatLngLike) => `${p.lat},${p.lng}`;
    const exactIndex = new Map<string, number[]>();
    for (let i = 0; i < course.length; i++) {
        const k = key(course[i]);
        if (!exactIndex.has(k)) exactIndex.set(k, []);
        exactIndex.get(k)!.push(i);
    }

    // 3) 체크포인트를 코스 인덱스로 매핑 (단조 증가 보장)
    const cpIdx: number[] = [];
    let cursor = 0;
    for (const cp of checkpoints) {
        // (a) 정확히 일치하는 포인트가 있고, cursor 이후면 그걸 사용
        const exact = exactIndex.get(key(cp));
        let picked = -1;
        if (exact) {
            // cursor 이상인 것 중 가장 앞
            picked = exact.find((idx) => idx >= cursor) ?? -1;
        }

        // (b) 없으면 근접 탐색: cursor부터 진행하며 eps 이내 최소값 찾기
        if (picked < 0) {
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = cursor; i < course.length; i++) {
                const d = getDistance(course[i], cp);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                    if (bestDist <= eps) break; // 충분히 가까워지면 멈춤
                }
            }
            picked = bestIdx;
        }

        if (picked < 0) {
            throw new Error(
                `Cannot map checkpoint to course (lat=${cp.lat}, lng=${cp.lng})`
            );
        }

        // 단조 증가 강제 (동일 인덱스 연속은 스킵)
        if (cpIdx.length === 0 || picked > cpIdx[cpIdx.length - 1]) {
            cpIdx.push(picked);
            cursor = picked;
        }
        // picked === last 인 경우는 중복 체크포인트로 간주하고 건너뜀
    }

    // 유효한 레그가 없으면 종료
    if (cpIdx.length < 2) return [];

    // 4) 레그 생성 (O(K), K = 체크포인트 개수)
    const legs: CourseLeg[] = [];
    let cum = 0;
    for (let i = 0; i < cpIdx.length - 1; i++) {
        const sIdx = cpIdx[i];
        const eIdx = cpIdx[i + 1];

        if (eIdx <= sIdx) continue; // 방어: 좌표 잡음으로 역전된 경우 스킵

        const start = checkpoints[i];
        const end = checkpoints[i + 1];
        const legDistance = segDist(sIdx, eIdx);
        cum += legDistance;

        legs.push({
            index: i,
            start,
            end,
            legDistance,
            cumDistance: cum,
            points: course.slice(sIdx, eIdx + 1), // end 포함, 중복 없이
        });
    }

    return legs;
}
