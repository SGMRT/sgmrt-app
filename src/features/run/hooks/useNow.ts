import { useEffect, useState } from "react";

export function useNow(enabled: boolean, intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [enabled, intervalMs]);
    return now;
}
