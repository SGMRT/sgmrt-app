import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { SplashScreen } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useSplashUntilLocationReady() {
    const { requestOrAlert, check } = useAppPermissions();
    const hiddenRef = useRef(false);

    const hideSplashSafe = useCallback(async () => {
        if (hiddenRef.current) return;
        hiddenRef.current = true;
        try {
            await SplashScreen.hideAsync();
        } catch {}
    }, []);

    const ensureReady = useCallback(async () => {
        // 1) 권한 체크
        const loc = await check("LOCATION");
        const granted = loc.ok;

        if (granted) {
            await hideSplashSafe();
            return true;
        }

        // 권한이 없으면 요청 + 알림
        if (!granted) {
            const ok = await requestOrAlert("LOCATION", "위치 권한이 필요해요");
            if (!ok) return false;
        }

        await hideSplashSafe();
        return true;
    }, [check, requestOrAlert, hideSplashSafe]);

    useEffect(() => {
        let mounted = true;

        // 최초 한 번 시도
        ensureReady();

        // 설정 갔다 오면 다시 점검
        const sub = AppState.addEventListener("change", (s) => {
            if (!mounted) return;
            if (s === "active") ensureReady();
        });

        return () => {
            mounted = false;
            sub.remove?.();
        };
    }, [ensureReady]);
}
