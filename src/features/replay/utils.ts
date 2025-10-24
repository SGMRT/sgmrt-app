import { Sample } from "./types";

// 선형 보간
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 라디안 → 도
const toDeg = (r: number) => (r * 180) / Math.PI;
// 두 점 사이의 헤딩 계산 (0°=북쪽 기준)
const headingBetween = (
    a: { x: number; y: number },
    b: { x: number; y: number }
) => (toDeg(Math.atan2(b.x - a.x, b.y - a.y)) + 360) % 360;

// -180..180로 정규화
const norm180 = (deg: number) => {
    let d = ((((deg + 180) % 360) + 360) % 360) - 180;
    return d === -180 ? 180 : d;
};

// 시간상수 → EMA 알파 (dt: 초)
const alphaFromTau = (tauSec: number, dtSec: number) =>
    tauSec <= 0 ? 1 : 1 - Math.exp(-dtSec / tauSec);

type TimelineMode = "distance" | "pace";

function buildVirtualTimeline(
    samples: Sample[],
    totalDistance: number, // 전체 거리(m)
    opts: {
        mode?: TimelineMode;
        virtualDurationMs?: number; // mode==="distance"일 때 전체 재생시간
    } = {}
) {
    const mode = opts.mode ?? "distance";
    const virtualDurationMs = opts.virtualDurationMs ?? 10 * 60 * 1000; // 기본 10분

    const n = samples.length;
    if (n === 0) return { T: [0], t0: 0, tN: 0, segDist: [], totalDist: 0 };

    // segment 거리(m)
    const segDist: number[] = new Array(Math.max(0, n - 1)).fill(0);
    let distSum = 0;

    for (let i = 0; i < n - 1; i++) {
        // 우선 d(누적거리)가 있으면 그 차이를 사용
        const d0 = samples[i]?.d;
        const d1 = samples[i + 1]?.d;
        let dd = 0;
        if (Number.isFinite(d0) && Number.isFinite(d1)) {
            dd = Math.max(0, (d1 as number) - (d0 as number));
        } else {
            // d가 없으면 좌표로 근사거리 (매우 짧은 구간이면 충분)
            dd = haversine(
                samples[i].y,
                samples[i].x,
                samples[i + 1].y,
                samples[i + 1].x
            );
        }
        segDist[i] = dd;
        distSum += dd;
    }

    // totalDistance 파라미터가 믿을만하면 그걸 우선, 아니면 계산값 사용
    const totalDistM = totalDistance > 0 ? totalDistance : distSum || 1;

    // dt 계산
    const dt: number[] = new Array(Math.max(0, n - 1)).fill(0);
    if (mode === "pace") {
        for (let i = 0; i < n - 1; i++) {
            const pSecPerKm = samples[i]?.p; // 초/킬로 (예: 300 = 5'00")
            const paceSec = Number.isFinite(pSecPerKm)
                ? (pSecPerKm as number)
                : null;
            if (paceSec && paceSec > 0) {
                dt[i] = (segDist[i] / 1000) * paceSec * 1000; // ms
            } else {
                // pace가 없으면 distance 비례로 폴백
                dt[i] = (segDist[i] / totalDistM) * virtualDurationMs;
            }
        }
    } else {
        // distance 모드: 전체 시간 고정 → 거리 비례 분배
        for (let i = 0; i < n - 1; i++) {
            dt[i] = (segDist[i] / totalDistM) * virtualDurationMs;
        }
    }

    // 누적 타임라인
    const T: number[] = new Array(n).fill(0);
    for (let i = 1; i < n; i++) {
        T[i] = T[i - 1] + dt[i - 1];
    }
    return { T, t0: 0, tN: T[n - 1], segDist, totalDist: totalDistM };
}

// 간단 하버사인 (미터)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export {
    alphaFromTau,
    buildVirtualTimeline,
    headingBetween,
    lerp,
    norm180,
    toDeg,
};
