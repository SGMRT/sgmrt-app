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

    if (last && last.isRunning === isRunning && last.end === start - 1) {
        // 같은 상태로 연속이면 뒤로 확장
        last.end = end;
    } else {
        next.push({ start, end, isRunning });
    }
    return next;
}

// 단일 샘플을 계속 붙이는 경우에 편한 헬퍼
export function appendOne(
    meta: SegmentMeta[],
    index: number,
    isRunning: boolean
) {
    return appendSegmentMeta(meta, index, 1, isRunning);
}
