export type SegmentMeta = {
    start: number; // Telemetry 배열 시작 인덱스 (inclusive)
    end: number; // Telemetry 배열 끝 인덱스   (inclusive)
    isRunning: boolean; // 달리는 구간 여부
};

export function appendSegmentMeta(
    meta: SegmentMeta[],
    start: number,
    count: number,
    isRunning: boolean
): SegmentMeta[] {
    if (count <= 0) return meta;

    const end = start + count - 1;
    const next = meta.slice();
    const last = next.at(-1);

    // 1) 같은 상태 + 연속이면 확장
    if (last && last.isRunning === isRunning && last.end === start - 1) {
        last.end = end;
        return next;
    }

    // 2) 다른 상태로 바뀌는 시점이고, 인덱스가 연속이면
    //    '브리지 포인트'로 이전 세그먼트의 마지막 점(start-1)을 포함
    const isContiguousToPrev = !!last && last.end === start - 1;
    const bridgedStart = isContiguousToPrev ? Math.max(0, start - 1) : start;

    next.push({ start: bridgedStart, end, isRunning });
    return next;
}

// 단일 샘플용 헬퍼
export function appendOne(
    meta: SegmentMeta[],
    index: number,
    isRunning: boolean
) {
    return appendSegmentMeta(meta, index, 1, isRunning);
}
