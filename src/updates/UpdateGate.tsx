import { useEffect, useState } from "react";
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
        checkOnForeground: true,
        reloadNonCritical,
        onCriticalStart: () => setOverlay(true),
        onCriticalDone: () => setOverlay(false),
        onNonCriticalDownloaded: () => {},
        onError: () => setOverlay(false),
    });

    // 부팅 직후 1회 체크
    useEffect(() => {
        if (bootReady) {
            const t = setTimeout(() => {
                checkOnce();
            }, 500);
            return () => clearTimeout(t);
        }
    }, [bootReady, checkOnce]);

    return <UpdateLoadingOverlay visible={overlay} />;
}
