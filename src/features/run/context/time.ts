export function getElapsedMs(
    startedAtMs: number,
    pausedAtMs: number | null,
    now: number
) {
    if (!startedAtMs) return 0;

    const anchor = pausedAtMs ?? now;
    return Math.max(0, anchor - startedAtMs);
}
