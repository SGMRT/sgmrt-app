// utils/pacemakerTelemetry.ts
import type { Pacemaker } from "@/src/apis/types/ghosty";
import type { Telemetry as CourseTelemetry } from "@/src/apis/types/run";

/** MM.SS 형식(예: 8.30 = 8분 30초)을 초/킬로로 변환 */
function parseMinDotSecToSec(input: string | number): number {
    // 문자열로 통일
    const raw = String(input).trim();

    // 음수/이상치 방어
    if (!raw || raw === "." || isNaN(Number(raw))) return 0;

    // 정수부(분)와 소수부(초) 분리
    const [minStr, secStrRaw = "0"] = raw.split(".");
    const minutes = Math.max(0, parseInt(minStr || "0", 10));

    // 소수부가 "30" => 30초, "05" => 5초
    // 숫자만 남기고 최대 2자리로 패딩/절단
    const secDigits = secStrRaw.replace(/\D+/g, "").padEnd(2, "0").slice(0, 2);
    let seconds = parseInt(secDigits || "0", 10);

    // 예외: 만약 실수 인코딩으로 8.3 처럼 들어오면 30초로 해석
    // (권장 입력은 8.30이지만, 8.3도 8:30으로 간주)
    if (secStrRaw.length === 1) {
        seconds = parseInt(secStrRaw, 10) * 10;
    }

    // 방어: 60초 이상 들어오면 (잘못된 포맷) 59로 클램프
    if (seconds >= 60) seconds = 59;

    return minutes * 60 + seconds; // 초/킬로
}

/** 초/킬로 -> m/s */
function secPerKmToMS(secPerKm: number) {
    return 1000 / Math.max(1e-9, secPerKm);
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function interpolateAtDistance(
    course: CourseTelemetry[],
    targetDist: number
): CourseTelemetry {
    const lastIdx = course.length - 1;
    if (targetDist <= course[0].dist) return { ...course[0], timeStamp: 0 };
    if (targetDist >= course[lastIdx].dist)
        return { ...course[lastIdx], timeStamp: 0 };

    let l = 0,
        r = lastIdx;
    while (l + 1 < r) {
        const m = (l + r) >> 1;
        if (course[m].dist < targetDist) l = m;
        else r = m;
    }

    const a = course[l],
        b = course[r];
    const span = Math.max(1e-9, b.dist - a.dist);
    const t = (targetDist - a.dist) / span;

    return {
        timeStamp: 0,
        lat: lerp(a.lat, b.lat, t),
        lng: lerp(a.lng, b.lng, t),
        dist: targetDist,
        pace: lerp(a.pace, b.pace, t), // 참고값(출력은 세트 pace로 덮어씀)
        alt: lerp(a.alt, b.alt, t),
        cadence: Math.round(lerp(a.cadence, b.cadence, t)),
        bpm: Math.round(lerp(a.bpm, b.bpm, t)),
        isRunning: true,
    };
}

export type GhostySampler = {
    totalDurationMs: number;
    getAt: (elapsedMs: number) => CourseTelemetry; // Telemetry.pace = "초/킬로"
    sample: (sampleMs?: number) => CourseTelemetry[]; // Telemetry.pace = "초/킬로"
};

export function mapPacemakerToTelemety(props: {
    pacemaker: Pacemaker | undefined;
    telemetries: CourseTelemetry[] | undefined;
    options?: {
        distanceScale?: number; // km면 1000(기본), m면 1
        overridePace?: boolean; // true면 결과 pace를 세트 pace(초/킬로)로 강제
    };
}): GhostySampler | null {
    const { pacemaker, telemetries, options } = props;
    const distanceScale = options?.distanceScale ?? 1000;
    const overridePace = options?.overridePace ?? true;

    if (!pacemaker || !telemetries || telemetries.length === 0) return null;

    const course = telemetries;
    const courseLast = course[course.length - 1].dist;

    // ⬇️ 세트 pace: "MM.SS" → 초/킬로 로 변환해서 사용
    const sets = pacemaker.sets.map((s) => {
        const startDist = s.startPoint * distanceScale;
        const endDist = s.endPoint * distanceScale;
        const distM = Math.max(0, endDist - startDist);

        const paceSecPerKm = parseMinDotSecToSec(s.pace as any); // 👈 핵심
        const speedMS = secPerKmToMS(paceSecPerKm);
        const durationSec = distM > 0 ? distM / speedMS : 0;

        return {
            startDist,
            endDist,
            distM,
            paceSecPerKm,
            speedMS,
            durationSec,
        };
    });

    if (sets.length > 0) {
        sets[0].startDist = 0;
        sets[sets.length - 1].endDist = Math.min(
            sets[sets.length - 1].endDist,
            courseLast
        );
        sets[sets.length - 1].distM = Math.max(
            0,
            sets[sets.length - 1].endDist - sets[sets.length - 1].startDist
        );
        sets[sets.length - 1].durationSec =
            sets[sets.length - 1].distM /
            Math.max(1e-9, sets[sets.length - 1].speedMS);
    }

    const cumSec: number[] = [0];
    for (const s of sets)
        cumSec.push(cumSec[cumSec.length - 1] + s.durationSec);
    const totalDurationSec = cumSec[cumSec.length - 1] || 0;
    const totalDurationMs = Math.round(totalDurationSec * 1000);

    function getAt(elapsedMs: number): CourseTelemetry {
        if (totalDurationMs <= 0) {
            const start = { ...course[0] };
            start.timeStamp = 0;
            if (overridePace && sets.length > 0)
                start.pace = sets[0].paceSecPerKm; // 🔁 초/킬로
            return start;
        }
        const clampedMs = Math.max(
            0,
            Math.min(totalDurationMs, Math.floor(elapsedMs))
        );
        const tSec = clampedMs / 1000;

        let i = 0;
        while (i + 1 < cumSec.length && cumSec[i + 1] <= tSec) i++;
        const idx = Math.min(Math.max(0, i), sets.length - 1);
        const cur = sets[idx];

        const localSec = Math.max(0, tSec - cumSec[idx]);
        const moved = Math.min(cur.distM, cur.speedMS * localSec);
        const targetDist = Math.min(
            cur.endDist,
            Math.max(cur.startDist, cur.startDist + moved)
        );

        const pos = interpolateAtDistance(course, targetDist);

        return {
            ...pos,
            timeStamp: clampedMs,
            // 결과 pace는 “초/킬로”
            pace: overridePace ? cur.paceSecPerKm : pos.pace,
            isRunning: true,
        };
    }

    function sample(sampleMs: number = 1000) {
        const out: CourseTelemetry[] = [];
        if (totalDurationMs <= 0) return out;
        for (let ms = 0; ms <= totalDurationMs; ms += sampleMs)
            out.push(getAt(ms));
        if (
            out.length === 0 ||
            out[out.length - 1].timeStamp !== totalDurationMs
        ) {
            out.push(getAt(totalDurationMs));
        }
        return out;
    }

    return { totalDurationMs, getAt, sample };
}
