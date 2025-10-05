import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

export function useEnsureRunReady() {
    const [ready, setReady] = useState(false);

    const { check, requestOrAlert } = useAppPermissions();

    const ensureReady = useCallback(async (): Promise<boolean> => {
        // 1) 권한 현황
        const [locChk, senChk] = await Promise.all([
            check("LOCATION"),
            check("SENSORS"),
        ]);
        let locOk = locChk.ok;
        let senOk = senChk.ok;

        // 2) 부족하면 요청 (필수이므로 Alert 포함)
        if (!senOk) {
            senOk = await requestOrAlert(
                "SENSORS",
                "러닝 센서 권한이 필요해요"
            );
            if (!senOk) return false; // 스플래시 유지
        }
        if (!locOk) {
            locOk = await requestOrAlert("LOCATION", "위치 권한이 필요해요");
            if (!locOk) return false; // 스플래시 유지
        }

        setReady(true);

        return true;
    }, [check, requestOrAlert]);

    useEffect(() => {
        let mounted = true;
        ensureReady();

        // 설정 갔다 오거나 앱 재활성화 시 재검증
        const sub = AppState.addEventListener("change", (s) => {
            if (!mounted) return;
            if (s === "active") ensureReady();
        });

        return () => {
            mounted = false;
            sub.remove?.();
        };
    }, [ensureReady]);

    return ready;
}
