import { useEffect, useRef, useState } from "react";
import UpdateLoadingOverlay from "./UpdateLoadingOverlay";
import { useUpdateOrchestrator } from "./useUpdateOrchestrator";
type Props = {
    bootReady?: boolean;
    reloadNonCritical?: boolean;
};

export default function UpdateGate({
    bootReady = true,
    reloadNonCritical = false,
}: Props) {
    const [overlay, setOverlay] = useState(false);

    const { checkOnce } = useUpdateOrchestrator({
        checkOnForeground: false,
        reloadNonCritical,
        onCriticalStart: () => setOverlay(true),
        onCriticalDone: () => setOverlay(false),
        onNonCriticalDownloaded: () => {},
        onError: () => setOverlay(false),
    });

    const checkOnceRef = useRef(checkOnce);
    useEffect(() => {
        checkOnceRef.current = checkOnce;
    }, [checkOnce]);

    // 부팅 직후 1회 체크
    useEffect(() => {
        if (bootReady) {
            const t = setTimeout(() => {
                checkOnceRef.current?.();
            }, 500);
            return () => clearTimeout(t);
        }
    }, [bootReady]);

    return <UpdateLoadingOverlay visible={overlay} maxDots={0} />;
}
