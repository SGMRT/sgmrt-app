export class RingBuffer<T extends { timestamp: number }> {
    private buffer: T[] = [];
    constructor(private readonly limit: number) {}

    push(item: T) {
        this.buffer.push(item);
        if (this.buffer.length > this.limit) this.buffer.shift();
    }

    closest(ts: number, windowMs: number): T | undefined {
        if (this.buffer.length === 0) return undefined;
        let best: T | undefined;
        let bestDiff = Infinity;
        for (const item of this.buffer) {
            const diff = Math.abs(item.timestamp - ts);
            if (diff < bestDiff) {
                bestDiff = diff;
                best = item;
            }
        }
        return bestDiff <= windowMs ? best : undefined;
    }

    last(): T | undefined {
        return this.buffer.at(-1);
    }

    reset() {
        this.buffer = [];
    }
}
